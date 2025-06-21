'use client';

// This file serves as a wrapper to re-export the welcome email template
// to avoid ESM import issues with .tsx files in Next.js

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WelcomeEmail } from './welcome';

// Re-implement the generateWelcomeEmail function to avoid direct imports from .tsx files
export async function generateWelcomeEmail(props) {
  const { name, email, password: tempPassword, orderId, testName } = props;
  
  // Use renderToStaticMarkup directly here instead of importing it in the welcome.tsx file
  return {
    subject: 'Welcome to Eden Clinic – Your account is ready',
    html: renderToStaticMarkup(
      React.createElement(WelcomeEmail, { 
        name, 
        email, 
        tempPassword, 
        orderId, 
        testName 
      })
    ),
  };
}
