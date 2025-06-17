import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { AddressFormData } from '../validations/address';

const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Address = Database['public']['Tables']['addresses']['Row'];

export const addressService = {
  async getAddresses(clientId: string): Promise<Address[]> {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  createAddress: async (clientId: string, address: AddressFormData): Promise<Address> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // If this is the first address of its type, make it default
    const { data: existingAddresses } = await supabase
      .from('addresses')
      .select('id')
      .eq('client_id', clientId)
      .eq('type', address.type);

    const isFirstAddress = !existingAddresses || existingAddresses.length === 0;
    const addressData = {
      client_id: clientId,
      ...address,
      is_default: isFirstAddress ? true : address.isDefault,
    };

    const { data, error } = await supabase
      .from('addresses')
      .insert([addressData])
      .select()
      .single();

    if (error) {
      console.error('Error creating address:', error);
      throw error;
    }

    return data;
  },

  updateAddress: async (clientId: string, id: string, address: AddressFormData): Promise<Address> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // If this address is currently default and we're unsetting it,
    // ensure there's another address to make default
    if (!address.isDefault) {
      const { data: currentAddress } = await supabase
        .from('addresses')
        .select('is_default')
        .eq('id', id)
        .single();

      if (currentAddress?.is_default) {
        const { data: otherAddresses } = await supabase
          .from('addresses')
          .select('id')
          .eq('client_id', clientId)
          .eq('type', address.type)
          .neq('id', id);

        if (!otherAddresses || otherAddresses.length === 0) {
          throw new Error('Cannot unset default status: This is the only address of this type');
        }
      }
    }

    const { data, error } = await supabase
      .from('addresses')
      .update({ ...address })
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating address:', error);
      throw error;
    }

    return data;
  },

  deleteAddress: async (clientId: string, id: string): Promise<void> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the address details first
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientId)
      .single();

    if (!address) {
      throw new Error('Address not found');
    }

    if (address.is_default) {
      // Find another address of the same type to make default
      const { data: otherAddresses } = await supabase
        .from('addresses')
        .select('id')
        .eq('client_id', clientId)
        .eq('type', address.type)
        .neq('id', id)
        .limit(1);

      if (!otherAddresses || otherAddresses.length === 0) {
        throw new Error('Cannot delete default address: This is the only address of this type');
      }

      // Set another address as default before deleting this one
      const { error: updateError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', otherAddresses[0].id);

      if (updateError) {
        throw updateError;
      }
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    if (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },

  setDefaultAddress: async (clientId: string, id: string, type: 'SHIPPING' | 'BILLING'): Promise<void> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First, unset any existing default address of this type
    const { error: updateError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('client_id', clientId)
      .eq('type', type);

    if (updateError) {
      console.error('Error updating existing default address:', updateError);
      throw updateError;
    }

    // Then set the new default address
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('client_id', clientId);

    if (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  },
};
