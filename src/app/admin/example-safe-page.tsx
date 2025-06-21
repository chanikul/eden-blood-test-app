'use client';

import { SafeAuthGuard } from '@/components/admin/SafeAuthGuard';

export default function AdminExamplePage() {
  return (
    <SafeAuthGuard>
      {/* Your admin page content goes here */}
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Example Page</h1>
        <p className="mb-4">
          This page is protected by the SafeAuthGuard component, which prevents React from crashing
          when the session is null.
        </p>
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p className="font-bold">Authentication Successful</p>
          <p>You are viewing protected admin content.</p>
        </div>
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
          <p className="font-bold">Implementation Notes</p>
          <ul className="list-disc ml-5 mt-2">
            <li>SafeAuthGuard handles null sessions gracefully</li>
            <li>Development mode automatically bypasses authentication</li>
            <li>Shows proper loading and error states</li>
            <li>Prevents React error #418 and INITIAL_SESSION null issues</li>
          </ul>
        </div>
      </div>
    </SafeAuthGuard>
  );
}
