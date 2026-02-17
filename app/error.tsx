'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#1a1a2e] text-white font-mono text-sm">
      <h2 className="text-lg font-bold text-red-400 mb-4">Something went wrong</h2>
      <pre className="bg-black/40 p-4 rounded max-w-2xl overflow-auto max-h-64 whitespace-pre-wrap break-words">
        {error.message}
      </pre>
      {error.stack && (
        <details className="mt-4 max-w-2xl">
          <summary className="cursor-pointer text-navy-200">Stack trace</summary>
          <pre className="mt-2 bg-black/40 p-4 rounded overflow-auto max-h-48 text-xs whitespace-pre-wrap break-words">
            {error.stack}
          </pre>
        </details>
      )}
      <button
        onClick={reset}
        className="mt-6 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded"
      >
        Try again
      </button>
    </div>
  );
}
