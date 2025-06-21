import React, { useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import styles from './AddressAutocomplete.module.css';

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => void;
  defaultValue?: string;
  error?: string;
}

export function AddressAutocomplete({ onAddressSelect, defaultValue, error }: AddressAutocompleteProps) {
  // Check if API key exists before trying to load the script
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const hasApiKey = !!apiKey && apiKey.length > 10; // Basic validation that it's not empty or too short
  
  // Only attempt to load the script if we have an API key
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Log the Google Maps API key (first few characters)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    console.log('Google Maps API Key available:', apiKey ? 'Yes' : 'No');
    if (apiKey) {
      console.log('API Key starts with:', apiKey.substring(0, 4) + '...');
    }

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "gb" },
        fields: ["address_components"],
        types: ["address"],
      });

      autocompleteRef.current.addListener("place_changed", () => {
        if (!autocompleteRef.current) return;

        const place = autocompleteRef.current.getPlace();
        if (!place.address_components) return;

        const addressComponents = place.address_components;
        const addressData = {
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        };

        // Extract address components
        addressComponents.forEach((component) => {
          const type = component.types[0];
          if (type === "street_number") {
            addressData.line1 = component.long_name;
          } else if (type === "route") {
            addressData.line1 = addressData.line1
              ? `${addressData.line1} ${component.long_name}`
              : component.long_name;
          } else if (type === "postal_town" || type === "locality") {
            addressData.city = component.long_name;
          } else if (type === "administrative_area_level_1") {
            addressData.state = component.long_name;
          } else if (type === "postal_code") {
            addressData.postalCode = component.long_name;
          } else if (type === "country") {
            addressData.country = component.long_name;
          }
        });

        onAddressSelect(addressData);
      });
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onAddressSelect]);

  if (loadError) {
    console.error('Error loading Google Maps:', loadError);
    return (
      <div className={styles.container}>
        <input
          type="text"
          placeholder="Address lookup unavailable"
          className={`${styles.input} ${styles.disabled}`}
          disabled
        />
        {error && <span className={styles.error}>{error}</span>}
        {process.env.NODE_ENV === 'development' && (
          <div className={styles.error}>
            Google Maps API error: {loadError.message || 'Failed to load'}
            {!hasApiKey && <p>Missing or invalid Google Maps API key</p>}
          </div>
        )}
      </div>
    );
  }
  
  if (!hasApiKey) {
    console.error('Missing or invalid Google Maps API key');
    return (
      <div className={styles.container}>
        <input
          type="text"
          placeholder="Address lookup unavailable"
          className={`${styles.input} ${styles.disabled}`}
          disabled
        />
        {error && <span className={styles.error}>{error}</span>}
        {process.env.NODE_ENV === 'development' && (
          <div className={styles.error}>Missing or invalid Google Maps API key</div>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles.autocompleteWrapper}`}>
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder="Start typing your address..."
        className={styles.input}
        disabled={!isLoaded}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
