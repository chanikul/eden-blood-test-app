export interface BloodTest {
  id: string;
  testName: string;
  status: 'PENDING' | 'PAID' | 'COMPLETED';
  date: Date;
  followUpDate?: Date;
  followUpType?: string;
  followUpStatus: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'NONE';
}
