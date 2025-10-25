import { create } from "zustand";
import { getStoredToken } from "./useAuthStore";

interface Student {
  _id: string;
  matric_no: string;
  full_name: string;
  email: string;
  college: string;
  department: string;
  level: string;
  is_active: boolean;
  first_login: boolean;
  createdAt: string;
}

interface StudentCSVData {
  matric_no: string;
  full_name: string;
  email: string;
  college?: string;
  department?: string;
  level?: string;
}

interface UploadStudentsResponse {
  message: string;
  results: {
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors: Array<{
      matric_no: string;
      full_name: string;
      error: string;
    }>;
    target: {
      college: string;
      department: string;
      level: string;
    };
  };
}

interface StudentState {
  students: Student[];
  currentStudent: Student | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Actions
  fetchStudents: (
    token?: string,
    params?: {
      college?: string;
      department?: string;
      level?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => Promise<void>;

  fetchStudentsByCollege: (
    token?: string,
    collegeId?: string,
    params?: {
      department?: string;
      level?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => Promise<void>;

  fetchStudentsByDepartment: (
    token?: string,
    collegeId?: string,
    departmentId?: string,
    params?: {
      level?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => Promise<void>;

  fetchStudentById: (token?: string, id?: string) => Promise<void>;

  uploadStudents: (
    token: string,
    csvData: StudentCSVData[],
    target?: {
      college?: string;
      department?: string;
      level?: string;
    }
  ) => Promise<UploadStudentsResponse>;

  updateStudent: (
    token: string,
    id: string,
    data: Partial<Student>
  ) => Promise<void>;

  deleteStudent: (
    token?: string,
    id?: string,
    permanent?: boolean
  ) => Promise<void>;

  bulkUpdateStudents: (
    token: string,
    studentIds: string[],
    updates: Partial<Student>
  ) => Promise<void>;

  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const useStudentStore = create<StudentState>((set) => ({
  students: [],
  currentStudent: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  },

  fetchStudents: async (
    token?: string,
    params?: {
      college?: string;
      department?: string;
      level?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const authToken = token || getStoredToken();
    if (!authToken) return;

    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params?.college) queryParams.append("college", params.college);
      if (params?.department)
        queryParams.append("department", params.department);
      if (params?.level) queryParams.append("level", params.level);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const response = await fetch(
        `${API_URL}/api/admin/students?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch students");
      }

      const data = await response.json();
      set({
        students: data.students,
        pagination: {
          total: data.total,
          page: data.page,
          limit: params?.limit || 50,
          pages: data.pages,
        },
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch students",
      });
    }
  },

  fetchStudentsByCollege: async (
    token?: string,
    collegeId?: string,
    params?: {
      department?: string;
      level?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const authToken = token || getStoredToken();
    if (!authToken || !collegeId) return;

    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params?.department)
        queryParams.append("department", params.department);
      if (params?.level) queryParams.append("level", params.level);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const response = await fetch(
        `${API_URL}/api/admin/colleges/${collegeId}/students?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch students");
      }

      const data = await response.json();
      set({
        students: data.students,
        pagination: {
          total: data.total,
          page: data.page,
          limit: params?.limit || 50,
          pages: data.pages,
        },
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch students",
      });
    }
  },

  fetchStudentsByDepartment: async (
    token?: string,
    collegeId?: string,
    departmentId?: string,
    params?: {
      level?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const authToken = token || getStoredToken();
    if (!authToken || !collegeId || !departmentId) return;

    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params?.level) queryParams.append("level", params.level);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const response = await fetch(
        `${API_URL}/api/admin/colleges/${collegeId}/departments/${departmentId}/students?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch students");
      }

      const data = await response.json();
      set({
        students: data.students,
        pagination: {
          total: data.total,
          page: data.page,
          limit: params?.limit || 50,
          pages: data.pages,
        },
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch students",
      });
    }
  },

  fetchStudentById: async (token?: string, id?: string) => {
    const authToken = token || getStoredToken();
    if (!authToken || !id) return;

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/admin/students/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch student");
      }

      const data = await response.json();
      set({
        currentStudent: data.student,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch student",
      });
    }
  },

  uploadStudents: async (token, csvData, target) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/admin/upload-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          csv_data: csvData,
          target_college: target?.college,
          target_department: target?.department,
          target_level: target?.level,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload students");
      }

      const data = await response.json();
      set({ loading: false });
      return data;
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to upload students",
      });
      throw error;
    }
  },

  updateStudent: async (token, id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/admin/students/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update student");
      }

      set({ loading: false });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to update student",
      });
      throw error;
    }
  },

  deleteStudent: async (token, id, permanent = false) => {
    const authToken = token || getStoredToken();
    if (!authToken || !id) {
      set({
        error: "Authentication required",
        loading: false,
      });
      return;
    }

    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_URL}/api/admin/students/${id}?permanent=${permanent}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete student");
      }

      set({ loading: false });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to delete student",
      });
      throw error;
    }
  },

  bulkUpdateStudents: async (token, studentIds, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_URL}/api/admin/students/bulk-update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            student_ids: studentIds,
            updates,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to bulk update students");
      }

      set({ loading: false });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to bulk update students",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
