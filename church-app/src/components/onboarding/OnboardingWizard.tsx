'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OnboardingData, OnboardingStep, Role, SpecialistType } from '@/types';
import StepPersonalInfo from './StepPersonalInfo';
import StepSelectRole from './StepSelectRole';
import StepPrimaryAssignment from './StepPrimaryAssignment';
import StepSpecialistType from './StepSpecialistType';
import StepAdditionalResponsibilities from './StepAdditionalResponsibilities';
import StepReview from './StepReview';

interface OnboardingWizardProps {
  userId: string;
}

const STEPS: OnboardingStep[] = [
  'personal_info',
  'select_role',
  'primary_assignment',
  'specialist_type',
  'additional_responsibilities',
  'review',
];

const STEP_TITLES: Record<OnboardingStep, string> = {
  personal_info: 'Personal Information',
  select_role: 'Select Your Role',
  primary_assignment: 'Primary Assignment',
  specialist_type: 'Specialist Type',
  additional_responsibilities: 'Additional Responsibilities',
  review: 'Review & Submit',
};

export default function OnboardingWizard({ userId }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal_info');
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'member',
    assignmentType: 'unit',
    additionalDivisions: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const currentStepIndex = STEPS.indexOf(currentStep);

  // Determine which steps are applicable based on selections
  const getApplicableSteps = (): OnboardingStep[] => {
    const steps: OnboardingStep[] = ['personal_info', 'select_role', 'primary_assignment'];
    
    // Add specialist_type step if user selected specialist assignment
    if (data.assignmentType === 'specialist') {
      steps.push('specialist_type');
    }
    
    // Add additional responsibilities for non-members
    if (data.role !== 'member') {
      steps.push('additional_responsibilities');
    }
    
    steps.push('review');
    return steps;
  };

  const applicableSteps = getApplicableSteps();
  const isLastStep = currentStep === 'review';
  const progressPercent = ((applicableSteps.indexOf(currentStep) + 1) / applicableSteps.length) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    const steps = getApplicableSteps();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps = getApplicableSteps();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // 1. Update profile with personal info and role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
          profile_photo_url: data.profilePhotoUrl || null,
          role: data.role,
          role_subtype: data.assignmentType === 'specialist' ? 'specialist' : 'shepherd',
          approval_status: 'pending',
          onboarding_completed: true,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Create primary leadership assignment
      const assignmentData: Record<string, unknown> = {
        profile_id: userId,
        assignment_type: 'primary',
        unit_type: data.assignmentType === 'specialist' ? 'specialist' : data.unitType,
        is_active: true,
        assigned_at: new Date().toISOString(),
      };

      // Set the appropriate unit ID based on selection
      if (data.assignmentType === 'unit' && data.selectedUnitId) {
        switch (data.unitType) {
          case 'apostleship':
            assignmentData.apostleship_id = data.selectedUnitId;
            break;
          case 'overseership':
            assignmentData.overseership_id = data.selectedUnitId;
            break;
          case 'eldership':
            assignmentData.eldership_id = data.selectedUnitId;
            break;
          case 'priestship':
            assignmentData.priestship_id = data.selectedUnitId;
            break;
        }
      }

      if (data.assignmentType === 'specialist' && data.specialistType) {
        assignmentData.specialist_type = data.specialistType;
      }

      const { data: assignment, error: assignmentError } = await supabase
        .from('leadership_assignments')
        .insert(assignmentData)
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // 3. Update profile with primary assignment ID
      await supabase
        .from('profiles')
        .update({ primary_assignment_id: assignment.id })
        .eq('id', userId);

      // 4. Create additional responsibility assignments
      if (data.additionalDivisions.length > 0) {
        const additionalAssignments = data.additionalDivisions.map((divisionType) => ({
          profile_id: userId,
          assignment_type: 'additional' as const,
          unit_type: 'specialist' as const,
          specialist_type: divisionType,
          is_active: true,
          assigned_at: new Date().toISOString(),
        }));

        const { error: additionalError } = await supabase
          .from('leadership_assignments')
          .insert(additionalAssignments);

        if (additionalError) throw additionalError;
      }

      // Redirect to pending approval page
      router.push('/pending-approval');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete registration');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'personal_info':
        return <StepPersonalInfo data={data} updateData={updateData} onNext={nextStep} />;
      case 'select_role':
        return <StepSelectRole data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 'primary_assignment':
        return <StepPrimaryAssignment data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 'specialist_type':
        return <StepSpecialistType data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 'additional_responsibilities':
        return <StepAdditionalResponsibilities data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
      case 'review':
        return (
          <StepReview 
            data={data} 
            onBack={prevStep} 
            onSubmit={handleSubmit} 
            submitting={submitting}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Progress bar */}
      <div className="bg-gray-100 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {applicableSteps.indexOf(currentStep) + 1} of {applicableSteps.length}
          </span>
          <span className="text-sm font-medium text-green-700">
            {STEP_TITLES[currentStep]}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="p-6">
        {renderStep()}
      </div>
    </div>
  );
}
