// models/session.model.ts
export interface Session {
  session_id: number;
  refresh_token: string;
  expires_at: Date;
  user_agent?: string;
  ip_address?: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  revoked_at?: Date;
}
