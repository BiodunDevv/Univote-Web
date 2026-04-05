export interface Student {
  _id: string;
  matric_no?: string | null;
  display_identifier?: string | null;
  full_name: string;
  email?: string | null;
  first_login: boolean;
  department?: string | null;
  department_code?: string | null;
  college?: string | null;
  college_code?: string | null;
  level?: string | null;
  photo_url?: string | null;
  has_facial_data?: boolean;
  face_enrollment_status?: "pending" | "failed" | "enrolled";
  last_face_enrolled_at?: string | null;
  last_face_enrollment_error?: string | null;
  is_active: boolean;
  has_voted_sessions?: string[];
  is_logged_in?: boolean;
  last_login_device?: string | null;
  last_login_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentListResponse {
  students: Student[];
  total: number;
  page: number;
  pages: number;
}

export interface StudentCSVData {
  matric_no?: string;
  full_name: string;
  email?: string;
  college?: string;
  department?: string;
  level?: string;
  photo_url?: string;
}

export interface UploadStudentsResponse {
  message: string;
  results: {
    total: number;
    created: number;
    failed: number;
    errors: Array<{
      matric_no: string;
      full_name: string;
      error?: string;
      warning?: string;
    }>;
    target: {
      college: string;
      department: string;
      level: string;
    };
  };
}

export interface VotingHistory {
  _id: string;
  session_id: {
    _id: string;
    title: string;
    start_time: string;
    end_time: string;
  };
  voted_at: string;
  status: string;
}
