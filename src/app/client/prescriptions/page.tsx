'use client';

import { useState } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle,
  RotateCcw,
  Download
} from 'lucide-react';

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_REFILL';
  lastRefill: Date;
  nextRefill?: Date;
  prescriptionUrl?: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: '1',
      medication: 'Vitamin D3',
      dosage: '1000 IU',
      frequency: 'Once daily',
      status: 'ACTIVE',
      lastRefill: new Date('2025-05-01'),
      nextRefill: new Date('2025-06-01'),
      prescriptionUrl: '/prescriptions/rx-123.pdf',
    },
    {
      id: '2',
      medication: 'Iron Supplement',
      dosage: '65mg',
      frequency: 'Twice daily',
      status: 'PENDING_REFILL',
      lastRefill: new Date('2025-04-15'),
    },
  ]);

  const getStatusBadge = (status: Prescription['status']) => {
    const styles = {
      ACTIVE: 'text-green-600 bg-green-50',
      EXPIRED: 'text-red-600 bg-red-50',
      PENDING_REFILL: 'text-amber-600 bg-amber-50',
    };

    const icons = {
      ACTIVE: <CheckCircle2 className="h-4 w-4 mr-1" />,
      EXPIRED: <XCircle className="h-4 w-4 mr-1" />,
      PENDING_REFILL: <Clock className="h-4 w-4 mr-1" />,
    };

    const labels = {
      ACTIVE: 'Active',
      EXPIRED: 'Expired',
      PENDING_REFILL: 'Refill Needed',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  const requestRefill = (prescriptionId: string) => {
    // TODO: API call to request refill
    setPrescriptions(prescriptions.map(prescription =>
      prescription.id === prescriptionId
        ? { ...prescription, status: 'PENDING_REFILL' as const }
        : prescription
    ));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Repeat Prescriptions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your prescriptions
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => {}}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request New Prescription
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {prescriptions.map((prescription) => (
            <li key={prescription.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center mb-1">
                    {getStatusBadge(prescription.status)}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {prescription.medication}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      Dosage: {prescription.dosage}
                    </p>
                    <p className="text-sm text-gray-500">
                      Frequency: {prescription.frequency}
                    </p>
                    <p className="text-sm text-gray-500">
                      Last Refill: {prescription.lastRefill.toLocaleDateString()}
                    </p>
                    {prescription.nextRefill && (
                      <p className="text-sm text-gray-500">
                        Next Refill: {prescription.nextRefill.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="ml-6 flex flex-col space-y-2">
                  {prescription.prescriptionUrl && (
                    <a
                      href={prescription.prescriptionUrl}
                      className="inline-flex items-center text-purple-600 hover:text-purple-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-5 w-5 mr-1" />
                      Download
                    </a>
                  )}
                  {prescription.status === 'ACTIVE' && (
                    <button
                      onClick={() => requestRefill(prescription.id)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <RotateCcw className="h-5 w-5 mr-1" />
                      Request Refill
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
