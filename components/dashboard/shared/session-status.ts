export function getSessionStatusDotClass(status: string) {
  if (status === "active") return "bg-green-500";
  if (status === "upcoming") return "bg-blue-500";
  return "bg-gray-300";
}
