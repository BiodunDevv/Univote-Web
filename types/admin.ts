export interface Admin {
  _id: string;
  email: string;
  full_name: string;
  role: "admin" | "super_admin";
  is_active: boolean;
  last_login_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  statistics: {
    total: number;
    active: number;
    inactive: number;
    super_admins: number;
    regular_admins: number;
  };
  recent_logins: Admin[];
}

export interface CreateAdminDto {
  email: string;
  password: string;
  full_name: string;
  role?: "admin" | "super_admin";
}

export interface UpdateAdminDto {
  full_name?: string;
  role?: "admin" | "super_admin";
  is_active?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AdminListResponse {
  admins: Admin[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
