import { redirect } from "next/navigation";

export default function StudentsUploadRedirectPage() {
  redirect("/dashboard/students?open=create&mode=bulk");
}
