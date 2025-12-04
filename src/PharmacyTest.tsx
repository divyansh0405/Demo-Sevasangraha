import React from 'react';
import PharmacyModule from './pages/Pharmacy';

/**
 * Standalone Pharmacy Module Test Component
 *
 * This is a simple wrapper to test the pharmacy module.
 * Replace your main App import in main.tsx with this to test.
 */
function PharmacyTest() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PharmacyModule />
    </div>
  );
}

export default PharmacyTest;
