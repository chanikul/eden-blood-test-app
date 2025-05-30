'use client';

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Home, Building2, PenSquare, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { addressService, Address } from '@/lib/services/address';
import { addressSchema, AddressFormData } from '@/lib/validations/address';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'SHIPPING',
      name: '',
      line1: '',
      line2: '',
      city: '',
      postcode: '',
      country: '',
      isDefault: false,
    },
  });

  const onSubmit = async (data: AddressFormData) => {
    if (!userId) {
      toast.error('Please log in to manage addresses');
      return;
    }

    try {
      setIsSaving(true);
      if (editingAddress) {
        await addressService.updateAddress(userId, editingAddress.id, data);
        toast.success('Address updated successfully');
      } else {
        await addressService.createAddress(userId, data);
        toast.success('Address added successfully');
      }
      handleCancel();
      fetchAddresses(userId);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save address');
      }
      console.error('Error saving address:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setValue('type', address.type);
    setValue('name', address.name);
    setValue('line1', address.line1);
    setValue('line2', address.line2 || '');
    setValue('city', address.city);
    setValue('postcode', address.postcode);
    setValue('country', address.country);
    setValue('isDefault', address.is_default);
    setShowAddressForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!userId) {
      toast.error('Please log in to manage addresses');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await addressService.deleteAddress(userId, id);
      toast.success('Address deleted successfully');
      fetchAddresses(userId);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete address');
      }
      console.error('Error deleting address:', error);
    }
  };

  const setAsDefault = async (id: string, type: 'SHIPPING' | 'BILLING') => {
    if (!userId) {
      toast.error('Please log in to manage addresses');
      return;
    }

    try {
      await addressService.setDefaultAddress(userId, id, type);
      toast.success(`Default ${type.toLowerCase()} address updated`);
      fetchAddresses(userId);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update default address');
      }
      console.error('Error setting default address:', error);
    }
  };

  const handleCancel = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    reset();
  };

  const fetchAddresses = async (clientId: string) => {
    try {
      const addresses = await addressService.getAddresses(clientId);
      setAddresses(addresses);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to load addresses');
      }
      console.error('Error loading addresses:', error);
    }
  };

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          fetchAddresses(session.user.id);
        } else {
          toast.error('Please log in to manage addresses');
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        toast.error('Failed to initialize user session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [supabase.auth]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Addresses</h1>
        <button
          onClick={() => setShowAddressForm(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Address
        </button>
      </div>

      {showAddressForm && (
        <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Address Type
              </label>
              <select
                id="type"
                {...register('type')}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              >
                <option value="SHIPPING">Shipping</option>
                <option value="BILLING">Billing</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name / Label
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder="e.g., Home, Office"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="line1" className="block text-sm font-medium text-gray-700">
                Address Line 1
              </label>
              <input
                type="text"
                id="line1"
                {...register('line1')}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder="Street address"
              />
              {errors.line1 && (
                <p className="mt-1 text-sm text-red-600">{errors.line1.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="line2" className="block text-sm font-medium text-gray-700">
                Address Line 2
              </label>
              <input
                type="text"
                id="line2"
                {...register('line2')}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                placeholder="Apartment, suite, etc. (optional)"
              />
              {errors.line2 && (
                <p className="mt-1 text-sm text-red-600">{errors.line2.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  {...register('city')}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                  Postcode
                </label>
                <input
                  type="text"
                  id="postcode"
                  {...register('postcode')}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
                {errors.postcode && (
                  <p className="mt-1 text-sm text-red-600">{errors.postcode.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  {...register('country')}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Address'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new address.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddressForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add Address
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Shipping Addresses */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Addresses</h2>
            <div className="space-y-4">
              {addresses
                .filter(addr => addr.type === 'SHIPPING')
                .map(address => (
                  <div key={address.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Home className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{address.name}</span>
                        {address.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(address)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <PenSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(address.id)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>{address.city}, {address.postcode}</p>
                      <p>{address.country}</p>
                    </div>
                    {!address.is_default && (
                      <button
                        onClick={() => setAsDefault(address.id, 'SHIPPING')}
                        className="mt-2 text-sm text-teal-600 hover:text-teal-700"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
          {/* Billing Addresses */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Addresses</h2>
            <div className="space-y-4">
              {addresses
                .filter(addr => addr.type === 'BILLING')
                .map(address => (
                  <div key={address.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{address.name}</span>
                        {address.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(address)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <PenSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(address.id)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>{address.city}, {address.postcode}</p>
                      <p>{address.country}</p>
                    </div>
                    {!address.is_default && (
                      <button
                        onClick={() => setAsDefault(address.id, 'BILLING')}
                        className="mt-2 text-sm text-teal-600 hover:text-teal-700"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
