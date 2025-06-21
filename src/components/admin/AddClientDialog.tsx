'use client';

import { useState } from 'react';
// import { Dialog } from '../ui/dialog'; // Temporarily removed for deployment
// import { Input } from '../ui/input'; // Temporarily removed for deployment
// import { Button } from '../ui/button'; // Temporarily removed for deployment
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddClientDialog({ open, onClose, onSuccess }: AddClientDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    mobile: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.name || !formData.email || !formData.dateOfBirth) {
        throw new Error('Please fill in all required fields');
      }

      // Send request to create client
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      const data = await response.json();
      
      toast.success('Client added successfully. Welcome email sent.');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error('Error creating client:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-2xl font-semibold mb-4">Add New Client</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="client@example.com"
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="+44 7700 900000"
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Add Client'
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              * A secure password will be automatically generated and sent to the client via email
            </p>
          </form>
        </div>
      </div>
    ) : null
  );
}
