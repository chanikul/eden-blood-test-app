import { PrismaClient } from '@prisma/client';

// Use the PrismaClient directly to ensure all models are available
const prisma = new PrismaClient();

/**
 * Log an admin action to the AdminAuditLog table
 * 
 * @param adminId - ID of the admin performing the action
 * @param action - Description of the action (e.g., 'CREATE_CLIENT', 'UPDATE_CLIENT', etc.)
 * @param entityId - Optional ID of the entity being acted upon (e.g., client ID)
 * @param entityType - Optional type of entity (e.g., 'CLIENT', 'ORDER', etc.)
 * @param details - Optional JSON details about the action
 * @returns The created audit log entry
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  entityId?: string,
  entityType?: string,
  details?: Record<string, any>
) {
  try {
    const auditLog = await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        entityId,
        entityType,
        details: details ? details : undefined,
      },
    });
    
    return auditLog;
  } catch (error) {
    console.error('Failed to log admin action:', {
      error,
      adminId,
      action,
      entityId,
      entityType,
    });
    
    // Don't throw error - logging should not break the main flow
    return null;
  }
}

/**
 * Common admin action types for consistency
 */
export const AdminActions = {
  CREATE_CLIENT: 'CREATE_CLIENT',
  UPDATE_CLIENT: 'UPDATE_CLIENT',
  DELETE_CLIENT: 'DELETE_CLIENT',
  TOGGLE_CLIENT_STATUS: 'TOGGLE_CLIENT_STATUS',
  UPLOAD_TEST_RESULT: 'UPLOAD_TEST_RESULT',
  UPDATE_TEST_RESULT: 'UPDATE_TEST_RESULT',
  DELETE_TEST_RESULT: 'DELETE_TEST_RESULT',
  CREATE_ORDER: 'CREATE_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  DELETE_ORDER: 'DELETE_ORDER',
  DISPATCH_ORDER: 'DISPATCH_ORDER',
};

/**
 * Common entity types for consistency
 */
export const EntityTypes = {
  CLIENT: 'CLIENT',
  TEST_RESULT: 'TEST_RESULT',
  ORDER: 'ORDER',
  BLOOD_TEST: 'BLOOD_TEST',
};
