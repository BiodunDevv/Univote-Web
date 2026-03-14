import { SessionCandidate } from "@/types/session";

export type { SessionCandidate };

export interface SessionCreationFormData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: {
    lat: number;
    lng: number;
    radius_meters: number;
  };
  eligible_departments: string[];
  eligible_levels: string[];
  categories: string[];
  is_off_campus_allowed: boolean;
  candidates: SessionCandidate[];
}

export interface SessionCreationCollege {
  _id: string;
  name: string;
  code: string;
  departments: Array<{
    _id: string;
    name: string;
    code: string;
    available_levels: string[];
  }>;
}

export interface SessionCreationDepartment {
  _id: string;
  name: string;
  code: string;
  collegeName?: string;
}

export type SessionCreationStep =
  | "basic"
  | "schedule"
  | "eligibility"
  | "candidates"
  | "review";

export const SESSION_CREATION_STEPS: Array<{
  id: SessionCreationStep;
  title: string;
  description: string;
}> = [
  {
    id: "basic",
    title: "Basic",
    description: "Title, description, categories",
  },
  {
    id: "schedule",
    title: "Schedule",
    description: "Timing and location",
  },
  {
    id: "eligibility",
    title: "Eligibility",
    description: "Departments and levels",
  },
  {
    id: "candidates",
    title: "Candidates",
    description: "Set up ballot options",
  },
  {
    id: "review",
    title: "Review",
    description: "Validate and create",
  },
];
