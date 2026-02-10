'use client';

export default function ProfileSetupError() {
  return (
    <div className="p-6">
      <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-red-800 mb-2">Profile Setup Failed</h1>
        <p className="text-red-600 mb-4">
          We couldn&apos;t create your profile. This is usually a temporary issue.
        </p>
        <p className="text-sm text-red-500 mb-4">
          Please try refreshing the page. If the problem persists, contact your church administrator.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
