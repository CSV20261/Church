'use client';

import { OnboardingData, formatRole, formatSpecialistType } from '@/types';

interface StepReviewProps {
  data: OnboardingData;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}

export default function StepReview({ data, onBack, onSubmit, submitting, error }: StepReviewProps) {
  const getAssignmentDescription = (): string => {
    if (data.assignmentType === 'specialist' && data.specialistType) {
      return `${formatSpecialistType(data.specialistType)} Specialist`;
    }
    if (data.unitType) {
      const unitTypeLabels: Record<string, string> = {
        apostleship: 'Apostleship',
        overseership: 'Overseership',
        eldership: 'Eldership',
        priestship: 'Priestship',
      };
      return `${unitTypeLabels[data.unitType] || data.unitType} (Shepherd)`;
    }
    return 'Not specified';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Review & Submit</h2>
        <p className="text-neutral-600 text-sm">
          Please review your information before submitting.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Personal Information */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Personal Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Name:</span>
              <span className="font-medium text-neutral-800">{data.firstName} {data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Phone:</span>
              <span className="font-medium text-neutral-800">{data.phone}</span>
            </div>
          </div>
        </div>

        {/* Role */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Church Role</h3>
          <div className="flex justify-between">
            <span className="text-neutral-600">Role:</span>
            <span className="font-medium text-neutral-800">{formatRole(data.role)}</span>
          </div>
        </div>

        {/* Primary Assignment */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Primary Assignment</h3>
          <div className="flex justify-between">
            <span className="text-neutral-600">Assignment:</span>
            <span className="font-medium text-neutral-800">{getAssignmentDescription()}</span>
          </div>
        </div>

        {/* Additional Responsibilities */}
        {data.additionalDivisions && data.additionalDivisions.length > 0 && (
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Additional Responsibilities</h3>
            <div className="flex flex-wrap gap-2">
              {data.additionalDivisions.map((div) => (
                <span
                  key={div}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {formatSpecialistType(div)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Approval Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>⏳ Approval Required:</strong> Your registration will be reviewed by church leadership. 
          You will receive full access once approved.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={submitting}
          className="px-6 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </span>
          ) : (
            'Submit Registration'
          )}
        </button>
      </div>
    </div>
  );
}

