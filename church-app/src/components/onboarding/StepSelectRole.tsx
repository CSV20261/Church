'use client';

import { OnboardingData, Role, formatRole, ROLE_HIERARCHY } from '@/types';

interface StepSelectRoleProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface RoleOption {
  role: Role;
  description: string;
  icon: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'apostle',
    description: 'Head of the Apostleship, highest spiritual authority',
    icon: '👑',
  },
  {
    role: 'evangelist',
    description: 'Fourfold officer focused on spreading the gospel',
    icon: '📢',
  },
  {
    role: 'prophet',
    description: 'Fourfold officer with prophetic ministry',
    icon: '🔮',
  },
  {
    role: 'overseer_shepherd',
    description: 'Fourfold officer overseeing multiple elderships',
    icon: '🐑',
  },
  {
    role: 'elder',
    description: 'Shepherd overseeing multiple priestships',
    icon: '📖',
  },
  {
    role: 'priest',
    description: 'Pastor of a local congregation (priestship)',
    icon: '⛪',
  },
  {
    role: 'underdeacon',
    description: 'Assistant serving under a priest',
    icon: '🤝',
  },
  {
    role: 'member',
    description: 'Church member (requires approval for access)',
    icon: '👤',
  },
];

export default function StepSelectRole({ data, updateData, onNext, onBack }: StepSelectRoleProps) {
  const handleRoleSelect = (role: Role) => {
    updateData({ role });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Select Your Role</h2>
        <p className="text-neutral-600 text-sm">
          Choose the role that matches your position in the church. This will be verified by leadership.
        </p>
      </div>

      <div className="space-y-3">
        {ROLE_OPTIONS.map((option) => (
          <button
            key={option.role}
            onClick={() => handleRoleSelect(option.role)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              data.role === option.role
                ? 'border-green-600 bg-green-50'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-800">
                    {formatRole(option.role)}
                  </span>
                  <span className="text-xs text-neutral-400">
                    Level {ROLE_HIERARCHY[option.role]}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">{option.description}</p>
              </div>
              {data.role === option.role && (
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {data.role === 'member' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> As a member, you will have limited app access until approved by your priest or elder.
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

