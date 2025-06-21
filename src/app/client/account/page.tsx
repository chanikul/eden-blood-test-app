'use client';

import { useState, useEffect } from 'react';
import styles from './account.module.css';
import { User, Mail, Lock, Phone, Calendar, X, Bell, MapPin, FileText, Clock, Download } from 'lucide-react';

interface Address {
  id: string;
  type: 'SHIPPING' | 'BILLING';
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  isDefault: boolean;
}

interface TestOrder {
  id: string;
  testName: string;
  status: 'PENDING' | 'PAID' | 'DISPATCHED' | 'CANCELLED' | 'READY';
  createdAt: string;
  bloodTest?: {
    name: string;
    description: string;
  };
  testResults?: {
    id: string;
    status: 'processing' | 'ready';
    resultUrl?: string;
    createdAt: string;
  }[];
}

interface Profile {
  reminderPreferences: {
    emailReminders: boolean;
    smsReminders: boolean;
  };

  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt?: string;
  addresses?: Address[];
  defaultAddress?: Address | null;
  orders?: TestOrder[];
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile>({
    reminderPreferences: {
      emailReminders: true,
      smsReminders: false,
    },
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch user profile on component mount
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoading(true);
        console.log('Fetching user profile...');
        const response = await fetch('/api/client/account', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response not OK:', response.status, errorText);
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw API response:', data);
        
        // Extract notification preferences or set defaults
        const reminderPreferences = {
          emailReminders: data.emailReminders ?? true,
          smsReminders: data.smsReminders ?? false,
        };
        
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.mobile || '',  // API returns 'mobile' but we use 'phone' in our component
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
          createdAt: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : '',
          addresses: Array.isArray(data.addresses) ? data.addresses : [],
          defaultAddress: data.defaultAddress || null,
          orders: Array.isArray(data.orders) ? data.orders : [],
          reminderPreferences,
        });
        
        console.log('Processed profile data:', profile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserProfile();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setSaveError(null);
      
      const response = await fetch('/api/client/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          reminderPreferences: profile.reminderPreferences,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Show success notification
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      console.log('Profile updated:', profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      const response = await fetch('/api/client/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update password');
      }
      
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Show success notification
      setPasswordSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      case 'DISPATCHED':
        return 'bg-purple-100 text-purple-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading your profile...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Personal Information Section */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <User className="mr-2" size={20} />
                Personal Information
              </h2>
              
              {saveSuccess && (
                <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
                  Profile updated successfully!
                </div>
              )}
              
              {saveError && (
                <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                  {saveError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
                  Password updated successfully!
                </div>
              )}
              
              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* First Name - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.firstName}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Lock size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Contact support to update this field</p>
                  </div>
                  
                  {/* Last Name - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.lastName}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Lock size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Contact support to update this field</p>
                  </div>
                  
                  {/* Email - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Lock size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Contact support to update this field</p>
                  </div>
                  
                  {/* Phone Number - Editable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Phone size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Date of Birth - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatDate(profile.dateOfBirth || '')}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Lock size={16} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Contact support to update this field</p>
                  </div>
                  
                  {/* Account Created */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Created
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatDate(profile.createdAt || '')}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Calendar size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Notification Preferences */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Bell className="mr-2" size={18} />
                    Notification Preferences
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="emailReminders"
                        checked={profile.reminderPreferences?.emailReminders || false}
                        onChange={(e) => setProfile({
                          ...profile,
                          reminderPreferences: {
                            ...profile.reminderPreferences,
                            emailReminders: e.target.checked,
                          },
                        })}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="emailReminders" className="ml-2 block text-sm text-gray-700">
                        Email reminders for upcoming tests and results
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="smsReminders"
                        checked={profile.reminderPreferences?.smsReminders || false}
                        onChange={(e) => setProfile({
                          ...profile,
                          reminderPreferences: {
                            ...profile.reminderPreferences,
                            smsReminders: e.target.checked,
                          },
                        })}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="smsReminders" className="ml-2 block text-sm text-gray-700">
                        SMS reminders for upcoming tests and results
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Form Actions */}
                <div className="flex justify-between items-center">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
            
            {/* Address Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin className="mr-2" size={20} />
                My Addresses
              </h2>
              
              {profile.addresses && profile.addresses.length > 0 ? (
                <div className="space-y-4">
                  {profile.addresses.map((address) => (
                    <div key={address.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium">{address.name}</span>
                          {address.isDefault && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                          <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            {address.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{address.line1}</p>
                        {address.line2 && <p>{address.line2}</p>}
                        <p>{address.city}, {address.postcode}</p>
                        <p>{address.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No addresses found. Addresses will be added when you place an order.</p>
              )}
            </div>
            
            {/* Test History Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="mr-2" size={20} />
                Test History
              </h2>
              
              {profile.orders && profile.orders.length > 0 ? (
                <div className="space-y-4">
                  {profile.orders.map((order) => (
                    <div key={order.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium">{order.bloodTest?.name || order.testName}</span>
                          <span className={`ml-2 text-xs px-2 py-1 rounded ${getStatusBadgeColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock size={14} className="mr-1" />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      
                      {order.testResults && order.testResults.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-sm font-medium mb-2">Test Results</h4>
                          {order.testResults.map((result) => (
                            <div key={result.id} className="flex justify-between items-center text-sm">
                              <div className="flex items-center">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${result.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                <span>
                                  Result from {formatDate(result.createdAt)}
                                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${getStatusBadgeColor(result.status)}`}>
                                    {result.status}
                                  </span>
                                </span>
                              </div>
                              {result.resultUrl && result.status === 'ready' && (
                                <a 
                                  href={result.resultUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <Download size={14} className="mr-1" />
                                  Download
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No test history found. Your test history will appear here after you place an order.</p>
              )}
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Account Security</h3>
              <p className="text-sm text-gray-600 mb-4">
                Protect your account by using a strong password and regularly updating it.
              </p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>
            
            {passwordError && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                {passwordError}
              </div>
            )}
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
