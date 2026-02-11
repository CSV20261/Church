'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OnboardingData, UnitType, Apostleship, Overseership, Eldership, Priestship } from '@/types';

interface StepPrimaryAssignmentProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepPrimaryAssignment({ data, updateData, onNext, onBack }: StepPrimaryAssignmentProps) {
  const [loading, setLoading] = useState(true);
  const [apostleships, setApostleships] = useState<Apostleship[]>([]);
  const [overseerships, setOverseerships] = useState<Overseership[]>([]);
  const [elderships, setElderships] = useState<Eldership[]>([]);
  const [priestships, setPriestships] = useState<Priestship[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Determine which unit types are available based on role
  const getAvailableUnitTypes = (): UnitType[] => {
    switch (data.role) {
      case 'apostle':
        return ['apostleship'];
      case 'evangelist':
      case 'prophet':
      case 'overseer_shepherd':
        return ['overseership'];
      case 'elder':
        return ['eldership'];
      case 'priest':
      case 'underdeacon':
      case 'member':
        return ['priestship'];
      default:
        return ['priestship'];
    }
  };

  const availableUnitTypes = getAvailableUnitTypes();
  const canBeSpecialist = !['apostle', 'member'].includes(data.role);

  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all hierarchical units
        console.log('Fetching organizational units...');
        
        // Try without is_active filter first to see if data exists
        const [apostleshipRes, overseershipsRes, eldershipsRes, priestshipsRes] = await Promise.all([
          supabase.from('apostleship').select('*'),
          supabase.from('overseerships').select('*'),
          supabase.from('elderships').select('*'),
          supabase.from('priestships').select('*'),
        ]);

        // Log results and errors for debugging
        console.log('Apostleship response:', { data: apostleshipRes.data, error: apostleshipRes.error });
        console.log('Overseerships response:', { data: overseershipsRes.data, error: overseershipsRes.error });
        console.log('Elderships response:', { data: eldershipsRes.data, error: eldershipsRes.error });
        console.log('Priestships response:', { data: priestshipsRes.data, error: priestshipsRes.error });

        // Check for errors
        if (apostleshipRes.error) {
          console.error('Apostleship error:', apostleshipRes.error);
          setError(`Error loading apostleships: ${apostleshipRes.error.message}`);
        }
        if (overseershipsRes.error) {
          console.error('Overseerships error:', overseershipsRes.error);
        }
        if (eldershipsRes.error) {
          console.error('Elderships error:', eldershipsRes.error);
        }
        if (priestshipsRes.error) {
          console.error('Priestships error:', priestshipsRes.error);
        }

        // Set data
        if (apostleshipRes.data) {
          console.log('Setting apostleships:', apostleshipRes.data.length, 'items');
          setApostleships(apostleshipRes.data);
        }
        if (overseershipsRes.data) setOverseerships(overseershipsRes.data);
        if (eldershipsRes.data) setElderships(eldershipsRes.data);
        if (priestshipsRes.data) setPriestships(priestshipsRes.data);
      } catch (err) {
        console.error('Error fetching units:', err);
        setError('Failed to load organizational units');
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const getUnitsForType = (type: UnitType) => {
    switch (type) {
      case 'apostleship':
        return apostleships;
      case 'overseership':
        return overseerships;
      case 'eldership':
        return elderships;
      case 'priestship':
        return priestships;
      default:
        return [];
    }
  };

  const getUnitLabel = (type: UnitType): string => {
    const labels: Record<UnitType, string> = {
      apostleship: 'Apostleship',
      overseership: 'Overseership',
      eldership: 'Eldership',
      priestship: 'Priestship',
      specialist: 'Specialist',
    };
    return labels[type];
  };

  const handleAssignmentTypeChange = (type: 'unit' | 'specialist') => {
    updateData({ 
      assignmentType: type,
      unitType: type === 'unit' ? availableUnitTypes[0] : undefined,
      selectedUnitId: undefined,
    });
  };

  const canProceed = () => {
    if (data.assignmentType === 'specialist') return true;
    return data.selectedUnitId !== undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Primary Assignment</h2>
        <p className="text-neutral-600 text-sm">
          Select where you serve in the church structure.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Assignment Type Selection (Shepherd vs Specialist) */}
      {canBeSpecialist && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-neutral-700">Assignment Type</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAssignmentTypeChange('unit')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                data.assignmentType === 'unit'
                  ? 'border-green-600 bg-green-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <span className="text-xl">🏠</span>
              <p className="font-medium text-neutral-800 mt-2">Shepherd</p>
              <p className="text-xs text-neutral-500">Lead one organizational unit</p>
            </button>
            <button
              onClick={() => handleAssignmentTypeChange('specialist')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                data.assignmentType === 'specialist'
                  ? 'border-green-600 bg-green-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <span className="text-xl">⭐</span>
              <p className="font-medium text-neutral-800 mt-2">Specialist</p>
              <p className="text-xs text-neutral-500">Focus on specific ministry area</p>
            </button>
          </div>
        </div>
      )}

      {/* Unit Selection (for Shepherd type) */}
      {data.assignmentType === 'unit' && (
        <div className="space-y-4">
          {availableUnitTypes.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Unit Type</label>
              <select
                value={data.unitType || availableUnitTypes[0]}
                onChange={(e) => updateData({ unitType: e.target.value as UnitType, selectedUnitId: undefined })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 text-neutral-900 bg-white"
              >
                {availableUnitTypes.map((type) => (
                  <option key={type} value={type}>
                    {getUnitLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Your {getUnitLabel(data.unitType || availableUnitTypes[0])}
            </label>
            {getUnitsForType(data.unitType || availableUnitTypes[0]).length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">
                  No {getUnitLabel(data.unitType || availableUnitTypes[0]).toLowerCase()}s have been created yet. 
                  Please contact an administrator to set up the organizational structure.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getUnitsForType(data.unitType || availableUnitTypes[0]).map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => updateData({ selectedUnitId: unit.id })}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      data.selectedUnitId === unit.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <p className="font-medium text-neutral-800">{unit.name}</p>
                    {'location' in unit && unit.location && (
                      <p className="text-sm text-neutral-500">{unit.location}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specialist info (details will be in next step) */}
      {data.assignmentType === 'specialist' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Specialist Role:</strong> You&apos;ll select your specific ministry focus in the next step 
            (Youth, Young Adult, Adult, Senior Citizens, Sunday School, or Evangelism).
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed()}
          className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

