import { BloodTest } from './blood-test';

export interface ReminderPreferences {
  emailReminders: boolean;
  smsReminders: boolean;
  bookingReminders: boolean;
  followUpReminders: boolean;
  reminderLeadTime: number; // hours before appointment
}

export interface BloodTestWithFollowUp extends BloodTest {
  followUpDate?: Date;
  followUpType?: string;
  followUpStatus: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'NONE';
}
