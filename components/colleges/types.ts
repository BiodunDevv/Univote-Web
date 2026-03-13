export interface Department {
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

export interface College {
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

export interface CollegeStatistics {
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

export interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
  hod_name: string;
  hod_email: string;
  available_levels: string[];
}

export interface CollegeCreationFormData {
  name: string;
  code: string;
  description: string;
  dean_name: string;
  dean_email: string;
  departments: DepartmentFormData[];
}

export type CollegeCreationStep = "basic" | "departments" | "review";

export interface CollegeCreationStepMeta {
  id: CollegeCreationStep;
  title: string;
  description: string;
}

export const COLLEGE_CREATION_STEPS: CollegeCreationStepMeta[] = [
  {
    id: "basic",
    title: "College Info",
    description: "Name, code, dean and description",
  },
  {
    id: "departments",
    title: "Departments",
    description: "Add departments and levels",
  },
  {
    id: "review",
    title: "Review",
    description: "Validate and create",
  },
];

export const AVAILABLE_LEVELS = ["100", "200", "300", "400", "500", "600"];

export type CollegeStatusFilter = "all" | "active" | "inactive";
