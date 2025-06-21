import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import crypto from 'crypto'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const bytes = crypto.randomBytes(length)
  let password = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = bytes[i] % charset.length
    password += charset[randomIndex]
  }

  return password
}

/**
 * Generate a secure password for new users
 * @returns A secure password with 10 characters
 */
export function generatePassword(): string {
  return generateRandomPassword(10)
}

/**
 * Format a date in a consistent way for display
 * @param date The date to format
 * @param formatString Optional format string (defaults to 'd MMMM yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatString: string = 'd MMMM yyyy'): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
}
