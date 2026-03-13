import * as React from "react";
import {
  IconChevronDown,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconLayoutColumns,
  IconTrash,
  IconUserCheck,
  IconUserX,
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
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Student } from "@/types/student";
import type { StudentsRegistryTableProps } from "./types";

function createColumns({
  selectedIds,
  isSuperAdmin,
  allVisibleSelected,
  onToggleAll,
  onToggleOne,
  onView,
  onEdit,
  onMarkActive,
  onMarkInactive,
  onDelete,
  onPreviewImage,
}: {
  selectedIds: string[];
  isSuperAdmin: boolean;
  allVisibleSelected: boolean;
  onToggleAll: () => void;
  onToggleOne: (studentId: string, checked: boolean) => void;
  onView: (studentId: string) => void;
  onEdit: (studentId: string) => void;
  onMarkActive: (studentId: string) => void;
  onMarkInactive: (studentId: string) => void;
  onDelete: (studentId: string) => void;
  onPreviewImage: (preview: {
    url: string;
    fullName: string;
    matricNo: string;
  }) => void;
}): ColumnDef<Student>[] {
  const columns: ColumnDef<Student>[] = [
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
  ];

  if (isSuperAdmin) {
    columns.push({
      id: "select",
      header: () => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={onToggleAll}
            className="h-4 w-4 rounded border-input"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={selectedIds.includes(row.original._id)}
            onChange={(event) =>
              onToggleOne(row.original._id, event.target.checked)
            }
            className="h-4 w-4 rounded border-input"
          />
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
      size: 52,
    });
  }

  columns.push(
    {
      accessorKey: "full_name",
      id: "student",
      header: "Student",
      cell: ({ row }) => (
        <div className="flex min-w-[220px] items-center gap-3 py-0.5">
          <button
            type="button"
            onClick={() => {
              if (!row.original.photo_url) return;
              onPreviewImage({
                url: row.original.photo_url,
                fullName: row.original.full_name,
                matricNo: row.original.matric_no,
              });
            }}
            className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-md border bg-muted/40 p-0.5"
          >
            {row.original.photo_url ? (
              <img
                src={row.original.photo_url}
                alt={row.original.full_name}
                className="h-full w-full rounded-sm object-contain"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-sm text-[10px] font-semibold text-muted-foreground">
                {row.original.full_name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            )}
            {row.original.photo_url && (
              <span className="absolute inset-0 hidden items-center justify-center bg-black/30 text-white group-hover:flex">
                <IconEye className="h-3.5 w-3.5" />
              </span>
            )}
          </button>

          <div className="min-w-0">
            <p className="truncate text-xs font-medium">
              {row.original.full_name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        </div>
      ),
      enableHiding: false,
      size: 340,
    },
    {
      accessorKey: "matric_no",
      id: "matric",
      header: "Matric",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.matric_no}</span>
      ),
      size: 130,
    },
    {
      accessorKey: "college",
      id: "college",
      header: "College",
      cell: ({ row }) => (
        <span
          className="block max-w-[180px] truncate text-xs"
          title={row.original.college}
        >
          {row.original.college}
        </span>
      ),
      size: 180,
    },
    {
      accessorKey: "department",
      id: "department",
      header: "Department",
      cell: ({ row }) => (
        <span
          className="block max-w-[170px] truncate text-xs"
          title={row.original.department}
        >
          {row.original.department}
        </span>
      ),
      size: 170,
    },
    {
      accessorKey: "level",
      id: "level",
      header: "Level",
      cell: ({ row }) => <span className="text-xs">{row.original.level}</span>,
      size: 90,
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
      accessorKey: "has_facial_data",
      id: "face",
      header: "Face",
      cell: ({ row }) =>
        row.original.has_facial_data ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        ),
      size: 90,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex h-8 w-8 text-muted-foreground"
              >
                <IconDotsVertical className="h-4 w-4" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onView(row.original._id)}>
                <IconEye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {isSuperAdmin && (
                <DropdownMenuItem onClick={() => onEdit(row.original._id)}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {isSuperAdmin && row.original.is_active && (
                <DropdownMenuItem
                  onClick={() => onMarkInactive(row.original._id)}
                >
                  <IconUserX className="mr-2 h-4 w-4" />
                  Mark Inactive
                </DropdownMenuItem>
              )}
              {isSuperAdmin && !row.original.is_active && (
                <DropdownMenuItem
                  onClick={() => onMarkActive(row.original._id)}
                >
                  <IconUserCheck className="mr-2 h-4 w-4" />
                  Mark Active
                </DropdownMenuItem>
              )}
              {isSuperAdmin && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(row.original._id)}
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
      size: 100,
    },
  );

  return columns;
}

export function StudentsRegistryTable({
  students,
  selectedIds,
  isSuperAdmin,
  onToggleAll,
  allVisibleSelected,
  onToggleOne,
  onView,
  onEdit,
  onMarkActive,
  onMarkInactive,
  onDelete,
  onPreviewImage,
}: StudentsRegistryTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const columns = React.useMemo(
    () =>
      createColumns({
        selectedIds,
        isSuperAdmin,
        allVisibleSelected,
        onToggleAll,
        onToggleOne,
        onView,
        onEdit,
        onMarkActive,
        onMarkInactive,
        onDelete,
        onPreviewImage,
      }),
    [
      selectedIds,
      isSuperAdmin,
      allVisibleSelected,
      onToggleAll,
      onToggleOne,
      onView,
      onEdit,
      onMarkActive,
      onMarkInactive,
      onDelete,
      onPreviewImage,
    ],
  );

  const table = useReactTable({
    data: students,
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
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {selectedIds.length} of {students.length} selected
        </div>
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

      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border bg-background">
        <Table className="w-full min-w-[1080px]">
          <TableHeader className="sticky top-0 z-10 bg-muted/70">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-3 py-2 text-xs font-medium"
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
                    <TableCell
                      key={cell.id}
                      className="px-3 py-2.5 align-middle"
                    >
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
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
