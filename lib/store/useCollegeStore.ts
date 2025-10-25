import { create } from "zustand";
import { getStoredToken } from "./useAuthStore";

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  hod_name?: string;
  hod_email?: string;
  available_levels: string[];
  is_active: boolean;
  student_count: number;
}

interface College {
  _id: string;
  name: string;
  code: string;
  description?: string;
  dean_name?: string;
  dean_email?: string;
  departments: Department[];
  is_active: boolean;
  student_count: number;
  createdAt: string;
  updatedAt: string;
}

interface CollegeFormData {
  name: string;
  code: string;
  description?: string;
  dean_name?: string;
  dean_email?: string;
  departments?: DepartmentFormData[];
  is_active?: boolean;
}

interface DepartmentFormData {
  name: string;
  code: string;
  description?: string;
  hod_name?: string;
  hod_email?: string;
  available_levels?: string[];
  is_active?: boolean;
}

interface SearchResult {
  department: Department;
  college: {
    id: string;
    name: string;
    code: string;
  };
}

interface CollegeStatistics {
  total_colleges: number;
  active_colleges: number;
  inactive_colleges: number;
  total_departments: number;
  total_students: number;
  colleges_breakdown: Array<{
    id: string;
    name: string;
    code: string;
    department_count: number;
    student_count: number;
    is_active: boolean;
  }>;
}

interface CollegeState {
  colleges: College[];
  currentCollege: College | null;
  statistics: CollegeStatistics | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchColleges: (token?: string, isActive?: boolean) => Promise<void>;
  fetchCollegeById: (token?: string, id?: string) => Promise<void>;
  fetchStatistics: (token?: string) => Promise<void>;
  createCollege: (token: string, data: CollegeFormData) => Promise<College>;
  updateCollege: (
    token: string,
    id: string,
    data: Partial<CollegeFormData>
  ) => Promise<College>;
  deleteCollege: (token: string, id: string, force?: boolean) => Promise<void>;

  // Department actions
  addDepartment: (
    token: string,
    collegeId: string,
    data: DepartmentFormData
  ) => Promise<Department>;
  updateDepartment: (
    token: string,
    collegeId: string,
    deptId: string,
    data: Partial<DepartmentFormData>
  ) => Promise<Department>;
  deleteDepartment: (
    token: string,
    collegeId: string,
    deptId: string,
    force?: boolean
  ) => Promise<void>;
  searchDepartments: (
    token: string,
    query: string,
    collegeId?: string
  ) => Promise<SearchResult[]>;

  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const useCollegeStore = create<CollegeState>((set) => ({
  colleges: [],
  currentCollege: null,
  statistics: null,
  loading: false,
  error: null,

  fetchColleges: async (token?: string, isActive?: boolean) => {
    const authToken = token || getStoredToken();
    if (!authToken) return;

    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (isActive !== undefined) params.append("is_active", String(isActive));

      const response = await fetch(`${API_URL}/api/admin/colleges?${params}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch colleges");
      }

      const data = await response.json();
      set({ colleges: data.colleges, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
    }
  },

  fetchCollegeById: async (token?: string, id?: string) => {
    const authToken = token || getStoredToken();
    if (!authToken || !id) return;

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/admin/colleges/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch college");
      }

      const data = await response.json();
      set({ currentCollege: data.college, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
    }
  },

  fetchStatistics: async (token?: string) => {
    const authToken = token || getStoredToken();
    if (!authToken) return;

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/admin/colleges/statistics`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch statistics");
      }

      const data = await response.json();
      set({ statistics: data.statistics, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
    }
  },

  createCollege: async (token: string, data: CollegeFormData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/admin/colleges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create college");
      }

      const result = await response.json();
      set((state) => ({
        colleges: [...state.colleges, result.college],
        loading: false,
      }));
      return result.college;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
      throw error;
    }
  },

  updateCollege: async (
    token: string,
    id: string,
    data: Partial<CollegeFormData>
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/admin/colleges/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update college");
      }

      const result = await response.json();
      set((state) => ({
        colleges: state.colleges.map((c) =>
          c._id === id ? result.college : c
        ),
        currentCollege:
          state.currentCollege?._id === id
            ? result.college
            : state.currentCollege,
        loading: false,
      }));
      return result.college;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
      throw error;
    }
  },

  deleteCollege: async (token: string, id: string, force = false) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_URL}/api/admin/colleges/${id}?force=${force}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete college");
      }

      set((state) => ({
        colleges: state.colleges.filter((c) => c._id !== id),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
      throw error;
    }
  },

  addDepartment: async (
    token: string,
    collegeId: string,
    data: DepartmentFormData
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_URL}/api/admin/colleges/${collegeId}/departments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add department");
      }

      const result = await response.json();
      set((state) => ({
        colleges: state.colleges.map((c) =>
          c._id === collegeId
            ? { ...c, departments: [...c.departments, result.department] }
            : c
        ),
        loading: false,
      }));
      return result.department;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
      throw error;
    }
  },

  updateDepartment: async (
    token: string,
    collegeId: string,
    deptId: string,
    data: Partial<DepartmentFormData>
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_URL}/api/admin/colleges/${collegeId}/departments/${deptId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update department");
      }

      const result = await response.json();
      set((state) => ({
        colleges: state.colleges.map((c) =>
          c._id === collegeId
            ? {
                ...c,
                departments: c.departments.map((d) =>
                  d._id === deptId ? result.department : d
                ),
              }
            : c
        ),
        loading: false,
      }));
      return result.department;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
      throw error;
    }
  },

  deleteDepartment: async (
    token: string,
    collegeId: string,
    deptId: string,
    force = false
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(
        `${API_URL}/api/admin/colleges/${collegeId}/departments/${deptId}?force=${force}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete department");
      }

      set((state) => ({
        colleges: state.colleges.map((c) =>
          c._id === collegeId
            ? {
                ...c,
                departments: c.departments.filter((d) => d._id !== deptId),
              }
            : c
        ),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
      throw error;
    }
  },

  searchDepartments: async (
    token: string,
    query: string,
    collegeId?: string
  ) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ query });
      if (collegeId) params.append("college_id", collegeId);

      const response = await fetch(
        `${API_URL}/api/admin/departments/search?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search departments");
      }

      const data = await response.json();
      set({ loading: false });
      return data.results;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
