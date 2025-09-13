// models/user.model.ts
export interface User {
  user_id: string;
  email: string;
  full_name: string;
  password: string;
  is_active: boolean;
}
