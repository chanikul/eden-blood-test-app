'use client';

import { useState } from 'react';
import { 
  Plane,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Plus
} from 'lucide-react';

interface TravelLetter {
  id: string;
  destination: string;
  departureDate: Date;
  returnDate: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: Date;
  letterUrl?: string;
}

export default function TravelLettersPage() {
  const [letters, setLetters] = useState<TravelLetter[]>([
    {
      id: '1',
      destination: 'Spain',
      departureDate: new Date('2025-06-15'),
      returnDate: new Date('2025-06-30'),
      status: 'APPROVED',
      requestDate: new Date('2025-05-20'),
      letterUrl: '/letters/travel-123.pdf',
    },
    {
      id: '2',
      destination: 'Thailand',
      departureDate: new Date('2025-07-01'),
      returnDate: new Date('2025-07-15'),
      status: 'PENDING',
      requestDate: new Date('2025-05-22'),
    },
  ]);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    departureDate: '',
    returnDate: '',
    additionalNotes: '',
  });

  const getStatusBadge = (status: TravelLetter['status']) => {
    const styles = {
      APPROVED: 'text-green-600 bg-green-50',
      PENDING: 'text-amber-600 bg-amber-50',
      REJECTED: 'text-red-600 bg-red-50',
    };

    const icons = {
      APPROVED: <CheckCircle2 className="h-4 w-4 mr-1" />,
      PENDING: <Clock className="h-4 w-4 mr-1" />,
      REJECTED: <XCircle className="h-4 w-4 mr-1" />,
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to submit request
    const newLetter: TravelLetter = {
      id: String(letters.length + 1),
      destination: formData.destination,
      departureDate: new Date(formData.departureDate),
      returnDate: new Date(formData.returnDate),
      status: 'PENDING',
      requestDate: new Date(),
    };
    setLetters([...letters, newLetter]);
    setShowRequestForm(false);
    setFormData({
      destination: '',
      departureDate: '',
      returnDate: '',
      additionalNotes: '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Travel Letters</h1>
          <p className="mt-1 text-sm text-gray-500">
            Request and manage your travel documentation
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => setShowRequestForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Travel Letter
          </button>
        </div>
      </div>

      {showRequestForm && (
        <div className="mb-8 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Request Travel Letter
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                Destination Country
              </label>
              <input
                type="text"
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">
                  Departure Date
                </label>
                <input
                  type="date"
                  id="departureDate"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">
                  Return Date
                </label>
                <input
                  type="date"
                  id="returnDate"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {letters.map((letter) => (
            <li key={letter.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center mb-1">
                    {getStatusBadge(letter.status)}
                  </div>
                  <div className="flex items-center">
                    <Plane className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {letter.destination}
                    </h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Travel Period: {letter.departureDate.toLocaleDateString()} - {letter.returnDate.toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <FileText className="h-4 w-4 mr-2" />
                      Requested: {letter.requestDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {letter.letterUrl && letter.status === 'APPROVED' && (
                  <div className="ml-6">
                    <a
                      href={letter.letterUrl}
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-5 w-5 mr-1" />
                      Download Letter
                    </a>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
