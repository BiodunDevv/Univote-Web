import type {
  CollegeCreationFormData,
  CollegeCreationStep,
  DepartmentFormData,
} from "./types";

export function validateCollegeStep(
  step: CollegeCreationStep,
  form: CollegeCreationFormData,
): string[] {
  const errors: string[] = [];

  if (step === "basic") {
    if (!form.name.trim()) errors.push("College name is required.");
    if (!form.code.trim()) errors.push("College code is required.");
    if (form.code.trim().length > 10)
      errors.push("College code must be 10 characters or fewer.");

    if (form.dean_email && !/\S+@\S+\.\S+/.test(form.dean_email)) {
      errors.push("Dean email must be a valid email address.");
    }
  }

  if (step === "departments") {
    form.departments.forEach((department, index) => {
      const label = `Department ${index + 1}`;

      if (!department.name.trim()) errors.push(`${label}: name is required.`);
      if (!department.code.trim()) errors.push(`${label}: code is required.`);
      if (department.code.trim().length > 6)
        errors.push(`${label}: code must be 6 characters or fewer.`);

      if (department.hod_email && !/\S+@\S+\.\S+/.test(department.hod_email)) {
        errors.push(`${label}: HOD email must be valid.`);
      }

      if (department.available_levels.length === 0) {
        errors.push(`${label}: select at least one level.`);
      }
    });

    const codes = form.departments
      .map((department) => department.code.trim().toUpperCase())
      .filter(Boolean);

    if (codes.length !== new Set(codes).size) {
      errors.push("Department codes must be unique.");
    }
  }

  return errors;
}

export function validateFullCollege(form: CollegeCreationFormData): string[] {
  const allErrors = [
    ...validateCollegeStep("basic", form),
    ...validateCollegeStep("departments", form),
  ];

  return Array.from(new Set(allErrors));
}

export function emptyDepartment(): DepartmentFormData {
  return {
    name: "",
    code: "",
    description: "",
    hod_name: "",
    hod_email: "",
    available_levels: ["100", "200", "300", "400"],
  };
}

export function emptyCollegeForm(): CollegeCreationFormData {
  return {
    name: "",
    code: "",
    description: "",
    dean_name: "",
    dean_email: "",
    departments: [],
  };
}

export function toggleLevel(levels: string[], level: string): string[] {
  return levels.includes(level)
    ? levels.filter((item) => item !== level)
    : [...levels, level].sort();
}
