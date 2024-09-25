"use client";

import { formatDate, formatDateTime, getDisplayStatus } from "@/lib/utils";
import Link from "next/link";
import { Button } from "./ui/button";
import { DownloadIcon, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Statuses } from "@/constants";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

export const columns = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Application ID" />
    ),
    cell: (info) => info.getValue(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "courseTitle",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Course Title" />
    ),
    cell: (info) => info.getValue(),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) => getDisplayStatus(info.getValue()),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: (info) => formatDateTime(info.getValue()).dateLong,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue.length !== 2) return true;
      const [start, end] = filterValue;
      const rowDate = new Date(row.getValue(columnId));
      return dayjs(rowDate).isBetween(start, end, "day", "[]");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const appID = row.getValue("id");
      return (
        <Link
          href={`/applications/${appID}`}
          className="inline-flex items-center justify-center bg-black px-10 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
        >
          View
        </Link>
      );
    },
  },
];

export const courseColumns = [
  {
    id: "code",
    accessorKey: "code",
    header: () => "Course Code",
    cell: (info) => info.getValue(),
  },
  {
    id: "name",
    accessorKey: "name",
    header: () => "Course Title",
    cell: (info) => info.getValue(),
  },
  {
    id: "status",
    accessorKey: "status",
    header: () => "Status",
    cell: (info) => {
      switch (info.getValue()) {
        case "Active":
          return <Badge variant="success">Active</Badge>;
        case "Inactive":
          return <Badge variant="inactive">Inactive</Badge>;
        default:
          return <Badge>Undefined</Badge>;
      }
    },
  },
  {
    id: "Action",
    header: () => "Action",
    cell: (info) => {
      const courseId = info.row.original.id;
      return (
        <Link href={`/courses/${courseId}`}>
          <Button variant="ghost" type="button">
            <Pencil className="size-4" />
          </Button>
        </Link>
      );
    },
  },
];

export const interviewFileColumns = (onDeleteFile) => [
  {
    id: "file",
    accessorKey: "name",
    header: () => "File",
    cell: (info) => {
      return (
        <span className="truncate overflow-hidden">{info.getValue()}</span>
      );
    },
  },
  {
    id: "upload_date",
    accessorKey: "createdAt",
    header: () => "Upload Date",
    cell: (info) => formatDate(info.getValue()),
  },
  {
    id: "actions",
    header: () => "Actions",
    cell: (info) => {
      const fileID = info.row.original.id;
      const fileKey = info.row.original.url.split("f/")[1];

      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            type="button"
            onClick={() => window.open(info.row.original.url, "file")}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => onDeleteFile({ fileID: fileID, fileKey: fileKey })}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      );
    },
  },
];

export const fileColumns = [
  {
    id: "file",
    accessorKey: "name",
    header: () => "File(s)",
    cell: (info) => {
      return (
        <span className="truncate overflow-hidden">{info.getValue()}</span>
      );
    },
  },
  {
    id: "actions",
    header: () => "Action",
    cell: (info) => {
      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            type="button"
            onClick={() => window.open(info.row.original.url, "file")}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={async () => {
              try {
                const blob = await fetch(info.row.original.url).then((r) =>
                  r.blob()
                );
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = info.row.original.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error("Download failed:", error);
              }
            }}
          >
            <DownloadIcon className="size-4" />
          </Button>
        </div>
      );
    },
  },
];
