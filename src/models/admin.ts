// models/admin.model.ts
export interface Admin {
  admin_id: string;
  email: string;
  full_name: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}
