import React from 'react';

export default function NotFound({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted mb-6">Page not found or you don’t have access.</p>
        <div className="flex justify-center">
          <button
            onClick={() => (onBack ? onBack() : (window.location.href = '/'))}
            className="btn-primary px-6 py-3 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
