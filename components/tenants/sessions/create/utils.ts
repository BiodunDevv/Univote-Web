import {
  SessionCreationCollege,
  SessionCreationFormData,
  SessionCreationStep,
} from "@/components/tenants/sessions/create/types";

type SessionEligibilityValidationOptions = {
  collegeEligibilityEnabled?: boolean;
  departmentEligibilityEnabled?: boolean;
  levelEligibilityEnabled?: boolean;
};

export function deriveAllDepartments(colleges: SessionCreationCollege[]) {
  const allDepartments: Array<{
    _id: string;
    name: string;
    code: string;
    collegeName?: string;
  }> = [];

  colleges.forEach((college) => {
    college.departments?.forEach((department) => {
      if (!allDepartments.find((item) => item._id === department._id)) {
        allDepartments.push({
          _id: department._id,
          name: department.name,
          code: department.code,
          collegeName: college.name,
        });
      }
    });
  });

  return allDepartments;
}

export function deriveAvailableLevels(
  departmentIds: string[],
  colleges: SessionCreationCollege[],
  selectedCollegeId?: string | null,
) {
  const levels = new Set<string>();

  if (selectedCollegeId && departmentIds.length === 0) {
    const college = colleges.find((item) => item._id === selectedCollegeId);
    college?.departments?.forEach((department) => {
      department.available_levels?.forEach((level) => levels.add(level));
    });
    return Array.from(levels).sort((a, b) => Number(a) - Number(b));
  }

  if (departmentIds.length === 0) {
    colleges.forEach((college) => {
      college.departments?.forEach((department) => {
        department.available_levels?.forEach((level) => levels.add(level));
      });
    });
    return Array.from(levels).sort((a, b) => Number(a) - Number(b));
  }

  departmentIds.forEach((departmentId) => {
    colleges.forEach((college) => {
      const department = college.departments?.find(
        (d) => d._id === departmentId,
      );
      department?.available_levels?.forEach((level) => levels.add(level));
    });
  });

  return Array.from(levels).sort((a, b) => Number(a) - Number(b));
}

export function deriveEligibleColleges(
  departmentIds: string[],
  colleges: SessionCreationCollege[],
) {
  const ids = new Set<string>();

  departmentIds.forEach((departmentId) => {
    colleges.forEach((college) => {
      if (
        college.departments?.some(
          (department) => department._id === departmentId,
        )
      ) {
        ids.add(college._id);
      }
    });
  });

  return Array.from(ids);
}

export function validateSessionStep(
  step: SessionCreationStep,
  formData: SessionCreationFormData,
  options: SessionEligibilityValidationOptions = {},
) {
  const errors: string[] = [];
  const collegeEligibilityEnabled =
    options.collegeEligibilityEnabled !== false;
  const departmentEligibilityEnabled =
    options.departmentEligibilityEnabled !== false;
  const levelEligibilityEnabled = Boolean(
    options.levelEligibilityEnabled,
  );

  if (step === "basic") {
    if (!formData.title.trim()) {
      errors.push("Session title is required.");
    }
    if (!formData.description.trim()) {
      errors.push("Session description is required.");
    }
    if (formData.title.trim().length > 0 && formData.title.trim().length < 4) {
      errors.push("Session title should be at least 4 characters.");
    }
    if (formData.categories.length === 0) {
      errors.push("Add at least one voting category.");
    }
  }

  if (step === "schedule") {
    if (!formData.start_time) {
      errors.push("Start time is required.");
    }
    if (!formData.end_time) {
      errors.push("End time is required.");
    }

    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time).getTime();
      const end = new Date(formData.end_time).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) {
        errors.push("Start time and end time must be valid dates.");
      } else if (end <= start) {
        errors.push("End time must be later than start time.");
      }
    }

    if (formData.location.radius_meters < 500) {
      errors.push("Voting radius should be at least 500 meters.");
    }
  }

  if (step === "eligibility") {
    if (
      collegeEligibilityEnabled &&
      !departmentEligibilityEnabled &&
      !formData.eligible_college
    ) {
      errors.push("Select one college.");
    }
    if (
      departmentEligibilityEnabled &&
      formData.eligible_departments.length === 0
    ) {
      errors.push("Select at least one department.");
    }
    if (levelEligibilityEnabled && formData.eligible_levels.length === 0) {
      errors.push("Select at least one level.");
    }
  }

  if (step === "candidates") {
    if (formData.candidates.length === 0) {
      errors.push("Add at least one candidate.");
    }

    formData.candidates.forEach((candidate, index) => {
      if (!candidate.name.trim()) {
        errors.push(`Candidate ${index + 1}: name is required.`);
      }
      if (!candidate.position.trim()) {
        errors.push(`Candidate ${index + 1}: position is required.`);
      } else if (!formData.categories.includes(candidate.position)) {
        errors.push(
          `Candidate ${index + 1}: position must match one of the configured categories.`,
        );
      }
    });
  }

  return errors;
}

export function validateFullSessionCreation(formData: SessionCreationFormData) {
  return validateFullSessionCreationWithOptions(formData);
}

export function validateFullSessionCreationWithOptions(
  formData: SessionCreationFormData,
  options: SessionEligibilityValidationOptions = {},
) {
  const steps: SessionCreationStep[] = [
    "basic",
    "schedule",
    "eligibility",
    "candidates",
  ];

  const allErrors = steps.flatMap((step) =>
    validateSessionStep(step, formData, options),
  );
  return Array.from(new Set(allErrors));
}
