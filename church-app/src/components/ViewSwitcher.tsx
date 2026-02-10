'use client';

import { useState, useEffect, useRef } from 'react';
import { LeadershipAssignment, ViewContext, formatSpecialistType } from '@/types';

interface ViewSwitcherProps {
  assignments: LeadershipAssignment[];
  currentContext: ViewContext | null;
  onContextChange: (context: ViewContext) => void;
}

const VIEW_CONTEXT_KEY = 'oac_view_context';

export default function ViewSwitcher({ 
  assignments, 
  currentContext, 
  onContextChange 
}: ViewSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load saved context from localStorage on mount
  useEffect(() => {
    const savedContext = localStorage.getItem(VIEW_CONTEXT_KEY);
    if (savedContext && assignments.length > 0) {
      try {
        const parsed = JSON.parse(savedContext) as ViewContext;
        // Verify the saved context is still valid
        const validAssignment = assignments.find(a => a.id === parsed.assignmentId);
        if (validAssignment) {
          onContextChange(parsed);
          return;
        }
      } catch (e) {
        console.error('Error parsing saved view context:', e);
      }
    }
    
    // Default to first assignment if no valid saved context
    if (assignments.length > 0 && !currentContext) {
      const defaultContext = assignmentToContext(assignments[0]);
      onContextChange(defaultContext);
    }
  }, [assignments, onContextChange, currentContext]);

  const assignmentToContext = (assignment: LeadershipAssignment): ViewContext => {
    let unitName = 'Unknown';
    let unitId: string | null = null;

    if (assignment.unit_type === 'specialist' && assignment.specialist_type) {
      unitName = `${formatSpecialistType(assignment.specialist_type)} Specialist`;
    } else if (assignment.apostleship) {
      unitName = assignment.apostleship.name;
      unitId = assignment.apostleship_id;
    } else if (assignment.overseership) {
      unitName = assignment.overseership.name;
      unitId = assignment.overseership_id;
    } else if (assignment.eldership) {
      unitName = assignment.eldership.name;
      unitId = assignment.eldership_id;
    } else if (assignment.priestship) {
      unitName = assignment.priestship.name;
      unitId = assignment.priestship_id;
    }

    return {
      assignmentId: assignment.id,
      assignmentType: assignment.assignment_type,
      unitType: assignment.unit_type,
      unitId,
      unitName,
      specialistType: assignment.specialist_type || undefined,
    };
  };

  const handleSelect = (assignment: LeadershipAssignment) => {
    const context = assignmentToContext(assignment);
    localStorage.setItem(VIEW_CONTEXT_KEY, JSON.stringify(context));
    onContextChange(context);
    setIsOpen(false);
  };

  const getAssignmentLabel = (assignment: LeadershipAssignment): string => {
    if (assignment.unit_type === 'specialist' && assignment.specialist_type) {
      return `${formatSpecialistType(assignment.specialist_type)} Division`;
    }
    if (assignment.apostleship) return assignment.apostleship.name;
    if (assignment.overseership) return assignment.overseership.name;
    if (assignment.eldership) return assignment.eldership.name;
    if (assignment.priestship) return assignment.priestship.name;
    return 'Unknown Assignment';
  };

  const getAssignmentIcon = (assignment: LeadershipAssignment): string => {
    if (assignment.unit_type === 'specialist') {
      const icons: Record<string, string> = {
        youth: '🎓',
        young_adult: '💼',
        adult: '👨‍👩‍👧',
        senior_citizen: '👴',
        sunday_school: '📚',
        evangelism: '🌍',
      };
      return icons[assignment.specialist_type || ''] || '⭐';
    }
    
    const unitIcons: Record<string, string> = {
      apostleship: '👑',
      overseership: '🐑',
      eldership: '📖',
      priestship: '⛪',
    };
    return unitIcons[assignment.unit_type] || '🏠';
  };

  // Don't render if only one assignment
  if (assignments.length <= 1) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
      >
        <span className="text-white/80">Viewing:</span>
        <span className="font-medium text-white">
          {currentContext?.unitName || 'Select...'}
        </span>
        <svg 
          className={`w-4 h-4 text-white/80 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Switch View</p>
          </div>
          
          {/* Primary assignment */}
          {assignments.filter(a => a.assignment_type === 'primary').map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => handleSelect(assignment)}
              className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                currentContext?.assignmentId === assignment.id ? 'bg-green-50' : ''
              }`}
            >
              <span className="text-lg">{getAssignmentIcon(assignment)}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-800">
                  {getAssignmentLabel(assignment)}
                </p>
                <p className="text-xs text-gray-500">Primary</p>
              </div>
              {currentContext?.assignmentId === assignment.id && (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}

          {/* Additional assignments */}
          {assignments.filter(a => a.assignment_type === 'additional').length > 0 && (
            <>
              <div className="px-3 py-2 border-t border-gray-100 mt-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Additional</p>
              </div>
              {assignments.filter(a => a.assignment_type === 'additional').map((assignment) => (
                <button
                  key={assignment.id}
                  onClick={() => handleSelect(assignment)}
                  className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    currentContext?.assignmentId === assignment.id ? 'bg-green-50' : ''
                  }`}
                >
                  <span className="text-lg">{getAssignmentIcon(assignment)}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {getAssignmentLabel(assignment)}
                    </p>
                    <p className="text-xs text-gray-500">Additional</p>
                  </div>
                  {currentContext?.assignmentId === assignment.id && (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
