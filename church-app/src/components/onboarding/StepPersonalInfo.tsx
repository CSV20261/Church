'use client';

import { useState } from 'react';
import { OnboardingData } from '@/types';

interface StepPersonalInfoProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function StepPersonalInfo({ data, updateData, onNext }: StepPersonalInfoProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!data.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!data.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s+()-]{10,}$/.test(data.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-800 mb-2">Personal Information</h2>
        <p className="text-neutral-600 text-sm">
          Please provide your details so we can identify you within the church.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.firstName}
              onChange={(e) => updateData({ firstName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900 ${
                errors.firstName ? 'border-red-500' : 'border-neutral-300'
              }`}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => updateData({ lastName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900 ${
                errors.lastName ? 'border-red-500' : 'border-neutral-300'
              }`}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-neutral-900 ${
              errors.phone ? 'border-red-500' : 'border-neutral-300'
            }`}
            placeholder="+27 XX XXX XXXX"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Profile Photo <span className="text-neutral-400">(optional)</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center overflow-hidden">
              {data.profilePhotoUrl ? (
                <img src={data.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-neutral-400">
                  {data.firstName ? data.firstName[0].toUpperCase() : '?'}
                </span>
              )}
            </div>
            <div className="text-sm text-neutral-500">
              <p>Photo upload will be available soon.</p>
              <p>You can add this later in your profile settings.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

