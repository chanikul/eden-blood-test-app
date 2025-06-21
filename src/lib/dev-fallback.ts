/**
 * Development Mode Fallback Utilities
 * 
 * This module provides utility functions for handling database connection issues
 * in development mode by providing mock data fallbacks.
 */

import { OrderStatus } from '@prisma/client';

/**
 * Mock data for development mode when database is unavailable
 */
export const MOCK_DATA = {
  orders: [
    { id: 'mock-1', patientName: 'John Smith', patientEmail: 'john@example.com', testName: 'Comprehensive Blood Panel', status: 'completed' as OrderStatus, createdAt: new Date(2025, 5, 10) },
    { id: 'mock-2', patientName: 'Sarah Johnson', patientEmail: 'sarah@example.com', testName: 'Hormone Panel', status: 'processing' as OrderStatus, createdAt: new Date(2025, 5, 12) },
    { id: 'mock-3', patientName: 'Michael Brown', patientEmail: 'michael@example.com', testName: 'Vitamin D Test', status: 'pending' as OrderStatus, createdAt: new Date(2025, 5, 13) },
    { id: 'mock-4', patientName: 'Emma Wilson', patientEmail: 'emma@example.com', testName: 'Thyroid Function', status: 'shipped' as OrderStatus, createdAt: new Date(2025, 5, 14) },
    { id: 'mock-5', patientName: 'Robert Davis', patientEmail: 'robert@example.com', testName: 'Liver Function', status: 'pending' as OrderStatus, createdAt: new Date(2025, 5, 15) },
  ],
  testResults: [
    { id: 'tr-1', clientId: 'client-1', orderId: 'order-1', status: 'ready', createdAt: new Date(2025, 5, 12), reviewedAt: null },
    { id: 'tr-2', clientId: 'client-2', orderId: 'order-2', status: 'processing', createdAt: new Date(2025, 5, 13), reviewedAt: null },
    { id: 'tr-3', clientId: 'client-3', orderId: 'order-3', status: 'ready', createdAt: new Date(2025, 5, 14), reviewedAt: new Date(2025, 5, 15) },
  ],
  bloodTests: [
    { id: 'bt-1', name: 'Comprehensive Blood Panel', price: 9900, description: 'Full blood workup including CBC, metabolic panel, and lipid profile' },
    { id: 'bt-2', name: 'Hormone Panel', price: 12900, description: 'Comprehensive hormone level testing' },
    { id: 'bt-3', name: 'Vitamin D Test', price: 4900, description: 'Check your vitamin D levels' },
    { id: 'bt-4', name: 'Thyroid Function', price: 7900, description: 'Complete thyroid hormone panel' },
    { id: 'bt-5', name: 'Liver Function', price: 6900, description: 'Comprehensive liver enzyme and function tests' },
  ],
  users: [
    { id: 'user-1', email: 'user1@example.com', name: 'User One' },
    { id: 'user-2', email: 'user2@example.com', name: 'User Two' },
    { id: 'user-3', email: 'user3@example.com', name: 'User Three' },
  ],
  admins: [
    { id: 'admin-1', email: 'admin@edenclinic.co.uk', name: 'Admin User' },
  ],
  stats: {
    bloodTests: 12,
    monthlyOrders: 28,
    testsInProgress: 8,
    completedTests: 15,
    pendingActions: {
      kitsToDispatch: 5,
      resultsToReview: 3,
      pendingDispatch: [
        { id: 'disp-1', patientName: 'Alex Turner', testName: 'Full Blood Count', createdAt: new Date(2025, 5, 14) },
        { id: 'disp-2', patientName: 'James Wilson', testName: 'Liver Function', createdAt: new Date(2025, 5, 15) },
        { id: 'disp-3', patientName: 'Emily Clark', testName: 'Thyroid Panel', createdAt: new Date(2025, 5, 15) },
      ],
      pendingReview: [
        { id: 'rev-1', clientId: 'client-1', orderId: 'order-1', createdAt: new Date(2025, 5, 14), client: { name: 'David Miller' }, order: { testName: 'Comprehensive Panel' } },
        { id: 'rev-2', clientId: 'client-2', orderId: 'order-2', createdAt: new Date(2025, 5, 15), client: { name: 'Sophie Adams' }, order: { testName: 'Hormone Panel' } },
        { id: 'rev-3', clientId: 'client-3', orderId: 'order-3', createdAt: new Date(2025, 5, 15), client: { name: 'Thomas Wright' }, order: { testName: 'Vitamin D Test' } },
      ]
    },
    userCount: 42
  }
};

/**
 * Executes a database query with a development mode fallback
 * 
 * @param dbQuery - The database query function to execute
 * @param fallbackData - The fallback data to return if the query fails in development mode
 * @returns The result of the database query or the fallback data
 */
export async function withDevFallback<T>(dbQuery: () => Promise<T>, fallbackData: T): Promise<T> {
  // In development mode, provide a fallback if database connection fails
  if (process.env.NODE_ENV === 'development') {
    try {
      return await dbQuery();
    } catch (error) {
      console.warn('Database connection failed in development mode, using mock data');
      return fallbackData;
    }
  }
  
  // In production, use normal database connection
  return await dbQuery();
}
