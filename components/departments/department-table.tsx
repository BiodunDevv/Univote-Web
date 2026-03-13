import * as React from "react";
import {
  IconChevronDown,
  IconEye,
  IconLayoutColumns,
} from "@tabler/icons-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DepartmentRow = {
  _id: string;
  name: string;
  code: string;
  hod_name: string;
  available_levels: string[];
  is_active: boolean;
  student_count: number;
  college: {
    id: string;
    name: string;
    code: string;
  };
};

type DepartmentTableProps = {
  departments: DepartmentRow[];
  onViewStudents: (department: DepartmentRow) => void;
};

function createColumns(
  onViewStudents: (department: DepartmentRow) => void,
): ColumnDef<DepartmentRow>[] {
  return [
    {
      id: "number",
      header: () => <div className="text-center">#</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="rounded-md border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {row.index + 1}
          </span>
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
      size: 56,
    },
    {
      accessorKey: "name",
      id: "department",
      header: "Department",
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <p className="truncate text-xs font-medium">{row.original.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {row.original.code}
          </p>
        </div>
      ),
      enableHiding: false,
      size: 260,
    },
    {
      accessorKey: "college.name",
      id: "college",
      header: "College",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.college.name}</span>
      ),
      size: 200,
    },
    {
      accessorKey: "hod_name",
      id: "hod",
      header: "HOD",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.hod_name || "-"}</span>
      ),
      size: 180,
    },
    {
      accessorKey: "available_levels",
      id: "levels",
      header: "Levels",
      cell: ({ row }) => (
        <span className="text-xs">
          {(row.original.available_levels || []).join(", ") || "-"}
        </span>
      ),
      size: 150,
    },
    {
      accessorKey: "student_count",
      id: "students",
      header: "Students",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.student_count}</span>
      ),
      size: 110,
    },
    {
      accessorKey: "is_active",
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            row.original.is_active
              ? "bg-green-500/10 text-green-700"
              : "bg-gray-500/10 text-gray-700"
          }`}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
      size: 120,
    },
    {
      id: "action",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onViewStudents(row.original)}
          >
            <IconEye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
        </div>
      ),
      enableSorting: false,
      size: 100,
    },
  ];
}

export function DepartmentTable({
  departments,
  onViewStudents,
}: DepartmentTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const columns = React.useMemo(
    () => createColumns(onViewStudents),
    [onViewStudents],
  );

  const table = useReactTable({
    data: departments,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    getRowId: (row) => row._id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-3 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {departments.length} rows loaded
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <IconLayoutColumns className="mr-2 h-4 w-4" />
              Columns
              <IconChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id.replace(/[._]/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border">
        <Table className="w-full min-w-[1040px]">
          <TableHeader className="sticky top-0 z-10 bg-muted/70">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-3 py-2"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center text-xs text-muted-foreground"
                >
                  No departments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
