import type { Student } from "@/types/student";

export type StudentsOverview = {
  totals: {
    total_students: number;
    active_students: number;
    inactive_students: number;
    with_facial_data: number;
  };
  colleges: Array<{
    id: string;
    name: string;
    code: string;
    departments: Array<{
      id: string;
      name: string;
      code: string;
    }>;
  }>;
  by_college: Array<{
    college: string;
    total: number;
    active: number;
  }>;
  by_department: Array<{
    college: string;
    department: string;
    total: number;
  }>;
  levels: string[];
};

export type StudentImagePreview = {
  url: string;
  fullName: string;
  identifier: string;
};

export type StudentsRegistryTableProps = {
  students: Student[];
  selectedIds: string[];
  canManageStudents: boolean;
  participantSingularLabel?: string;
  showCollegeField?: boolean;
  showDepartmentField?: boolean;
  showLevelField?: boolean;
  onToggleAll: () => void;
  allVisibleSelected: boolean;
  onToggleOne: (studentId: string, checked: boolean) => void;
  onView: (studentId: string) => void;
  onEdit: (studentId: string) => void;
  onMarkActive: (studentId: string) => void;
  onMarkInactive: (studentId: string) => void;
  onDelete: (studentId: string) => void;
  onPreviewImage: (preview: StudentImagePreview) => void;
};
