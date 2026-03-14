import { redirect } from "next/navigation";

export default function StudentsUploadRedirectPage() {
  redirect("/dashboard/participants?open=create&mode=bulk");
}
