'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

interface ResetPasswordDialogProps {
  userEmail: string;
  open: boolean;
  onClose: () => void;
}

export function ResetPasswordDialog({ userEmail, open, onClose }: ResetPasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate password reset');
      }

      setSent(true);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Error initiating password reset:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-2xl font-semibold mb-4">Reset Password</h2>
          {sent ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                A password reset email has been sent to {userEmail}. The link will expire in 1 hour.
              </p>
              <div className="flex justify-end">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Send a password reset email to:
              </p>
              <p className="font-medium">{userEmail}</p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleResetPassword}
                  loading={loading}
                >
                  Send Reset Email
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
