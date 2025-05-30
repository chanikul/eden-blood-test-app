export interface PatientUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  stripeCustomerId?: string;
}
