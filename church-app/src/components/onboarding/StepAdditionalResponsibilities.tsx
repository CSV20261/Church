'use client';

import { OnboardingData, SpecialistType, formatSpecialistType } from '@/types';

interface StepAdditionalResponsibilitiesProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface DivisionOption {
  type: SpecialistType;
  icon: string;
}

const DIVISION_OPTIONS: DivisionOption[] = [
  { type: 'youth', icon: '🎓' },
  { type: 'young_adult', icon: '💼' },
  { type: 'adult', icon: '👨‍👩‍👧' },
  { type: 'senior_citizen', icon: '👴' },
  { type: 'sunday_school', icon: '📚' },
  { type: 'evangelism', icon: '🌍' },
];

export default function StepAdditionalResponsibilities({ 
  data, 
  updateData, 
  onNext, 
  onBack 
}: StepAdditionalResponsibilitiesProps) {
  
  const toggleDivision = (type: SpecialistType) => {
    const current = data.additionalDivisions || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateData({ additionalDivisions: updated });
  };

  // Filter out the specialist type if already selected as primary
  const availableOptions = DIVISION_OPTIONS.filter(
    (opt) => opt.type !== data.specialistType
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Additional Responsibilities</h2>
        <p className="text-neutral-600 text-sm">
          Select any additional ministry areas you&apos;re involved in. This is optional.
        </p>
      </div>

      <div className="space-y-2">
        {availableOptions.map((option) => {
          const isSelected = data.additionalDivisions?.includes(option.type);
          return (
            <button
              key={option.type}
              onClick={() => toggleDivision(option.type)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? 'border-green-600 bg-green-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                isSelected ? 'bg-green-600 border-green-600' : 'border-neutral-300'
              }`}>
                {isSelected && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-xl">{option.icon}</span>
              <span className="font-medium text-neutral-800">
                {formatSpecialistType(option.type)} Division
              </span>
            </button>
          );
        })}
      </div>

      {data.additionalDivisions && data.additionalDivisions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Selected:</strong> {data.additionalDivisions.map(formatSpecialistType).join(', ')}
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
          className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

