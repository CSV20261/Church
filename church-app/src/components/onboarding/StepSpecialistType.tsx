'use client';

import { OnboardingData, SpecialistType, formatSpecialistType } from '@/types';

interface StepSpecialistTypeProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SpecialistOption {
  type: SpecialistType;
  description: string;
  icon: string;
}

const SPECIALIST_OPTIONS: SpecialistOption[] = [
  {
    type: 'youth',
    description: 'Ministry focused on young people (teens)',
    icon: '🎓',
  },
  {
    type: 'young_adult',
    description: 'Ministry for young adults (18-35)',
    icon: '💼',
  },
  {
    type: 'adult',
    description: 'Ministry for adults (35+)',
    icon: '👨‍👩‍👧',
  },
  {
    type: 'senior_citizen',
    description: 'Ministry for senior members',
    icon: '👴',
  },
  {
    type: 'sunday_school',
    description: 'Teaching ministry for children',
    icon: '📚',
  },
  {
    type: 'evangelism',
    description: 'Outreach and evangelism ministry',
    icon: '🌍',
  },
];

export default function StepSpecialistType({ data, updateData, onNext, onBack }: StepSpecialistTypeProps) {
  const handleSelect = (type: SpecialistType) => {
    updateData({ specialistType: type });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Specialist Ministry Focus</h2>
        <p className="text-gray-600 text-sm">
          Select your primary ministry focus area.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SPECIALIST_OPTIONS.map((option) => (
          <button
            key={option.type}
            onClick={() => handleSelect(option.type)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              data.specialistType === option.type
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{option.icon}</span>
            <p className="font-medium text-gray-800 mt-2">
              {formatSpecialistType(option.type)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!data.specialistType}
          className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
