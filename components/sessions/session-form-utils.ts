import {
  CreateSessionDto,
  SessionCandidate,
  VotingSession,
} from "@/types/session";
import { SessionCreationFormData } from "@/components/sessions/create/types";

const DEFAULT_LOCATION = {
  lat: 7.62024,
  lng: 4.202455,
  radius_meters: 2000,
};

export function createEmptyCandidate(): SessionCandidate {
  return {
    client_id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `candidate-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "",
    position: "",
    photo_url: "",
    bio: "",
    manifesto: "",
  };
}

export function createEmptySessionFormData(): SessionCreationFormData {
  return {
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: { ...DEFAULT_LOCATION },
    eligible_departments: [],
    eligible_levels: [],
    categories: [],
    is_off_campus_allowed: false,
    candidates: [],
  };
}

export function normalizeSessionForForm(
  session: VotingSession,
): SessionCreationFormData {
  return {
    title: session.title || "",
    description: session.description || "",
    start_time: session.start_time || "",
    end_time: session.end_time || "",
    location: {
      lat: session.location?.lat ?? DEFAULT_LOCATION.lat,
      lng: session.location?.lng ?? DEFAULT_LOCATION.lng,
      radius_meters:
        session.location?.radius_meters ?? DEFAULT_LOCATION.radius_meters,
    },
    eligible_departments: session.eligible_departments || [],
    eligible_levels: session.eligible_levels || [],
    categories: session.categories || [],
    is_off_campus_allowed: session.is_off_campus_allowed || false,
    candidates: (session.candidates || []).map((candidate) => ({
      _id: candidate._id,
      client_id: candidate.client_id,
      name: candidate.name || "",
      position: candidate.position || "",
      photo_url: candidate.photo_url || "",
      bio: candidate.bio || "",
      manifesto: candidate.manifesto || "",
      vote_count: candidate.vote_count,
    })),
  };
}

export function buildSessionPayload(
  formData: SessionCreationFormData,
  eligibleCollegeIds: string[],
): CreateSessionDto {
  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    start_time: formData.start_time,
    end_time: formData.end_time,
    location: {
      lat: formData.location.lat,
      lng: formData.location.lng,
      radius_meters: formData.location.radius_meters,
    },
    categories: formData.categories,
    eligible_college:
      eligibleCollegeIds.length === 1 ? eligibleCollegeIds[0] : null,
    eligible_departments: formData.eligible_departments,
    eligible_levels: formData.eligible_levels,
    is_off_campus_allowed: formData.is_off_campus_allowed,
    candidates: formData.candidates.map((candidate) => ({
      name: candidate.name.trim(),
      position: candidate.position,
      photo_url: candidate.photo_url,
      bio: candidate.bio,
      manifesto: candidate.manifesto,
    })),
  };
}

export function parseDateValue(value: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatDateButtonLabel(value: string, fallback: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return fallback;

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeValue(value: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return "";

  const hours = `${parsed.getHours()}`.padStart(2, "0");
  const minutes = `${parsed.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function mergeDateAndTime(
  currentValue: string,
  nextDate: Date | undefined,
  nextTime?: string,
) {
  if (!nextDate) return "";

  const existing = parseDateValue(currentValue);
  const timeValue = nextTime ?? (formatTimeValue(currentValue) || "09:00");
  const [hours, minutes] = timeValue.split(":").map(Number);
  const merged = new Date(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate(),
    Number.isFinite(hours) ? hours : existing?.getHours() || 9,
    Number.isFinite(minutes) ? minutes : existing?.getMinutes() || 0,
    0,
    0,
  );

  return merged.toISOString();
}
