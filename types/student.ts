export interface Student {
  _id: string;
  matric_no: string;
  full_name: string;
  email: string;
  first_login: boolean;
  department: string;
  department_code: string;
  college: string;
  level: string;
  has_voted_sessions: string[];
  is_logged_in: boolean;
  last_login_device: string | null;
  last_login_at: string | null;
  face_reference: {
    persistedFaceIds: string[];
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface StudentListResponse {
  students: Student[];
  total: number;
  page: number;
  pages: number;
}

export interface StudentCSVData {
  student_id: string;
  email: string;
  full_name: string;
  department: string;
}

export interface UploadStudentsResponse {
  message: string;
  summary: {
    total: number;
    created: number;
    updated: number;
    failed: number;
  };
  failed_records: {
    row: number;
    data: StudentCSVData;
    error: string;
  }[];
}
