import { TablePaginationControls } from "@/components/shared/table-pagination-controls";

type StudentsRegistryPaginationProps = {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

export function StudentsRegistryPagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
}: StudentsRegistryPaginationProps) {
  if (pages <= 1) return null;

  return (
    <TablePaginationControls
      page={page}
      pages={pages}
      total={total}
      limit={limit}
      onPageChange={onPageChange}
    />
  );
}
