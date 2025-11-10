// models/user.model.ts
export interface User {
  user_id: string;
  nik?: string;
  email?: string;
  full_name?: string;
  phone_number: string;
  pin?: string;
  created_at: Date;
  updated_at: Date;
}
