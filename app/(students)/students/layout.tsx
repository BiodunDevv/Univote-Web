import { StudentPwaBootstrap } from "@/components/students/student-pwa-bootstrap";

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StudentPwaBootstrap />
      {children}
    </>
  );
}
