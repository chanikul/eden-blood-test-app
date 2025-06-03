import { getServerSession } from './auth';
import { Session } from './auth';

/**
 * Gets the current session for API routes
 * This is a wrapper around getServerSession to make it easier to use in API routes
 * @returns The current session or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  return getServerSession();
}
