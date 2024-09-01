"use client";

import { formatDate, getDisplayStatus } from "@/lib/utils";
import Link from "next/link";
import { Button } from "./ui/button";
import { Eye, Trash2 } from "lucide-react";
import { handleDeleteFiles } from "./files-table";

export const columns = [
  {
    id: "id",
    accessorKey: "id",
    header: () => "Application ID",
    cell: (info) => {
      return (
        <Link href="#" className="hover:opacity-80 cursor-pointer ease-linear">
          {info.getValue()}
        </Link>
      );
    },
  },
  {
    id: "courseTitle",
    accessorKey: "courseTitle",
    header: () => "Course Title",
    cell: (info) => info.getValue(),
  },
  {
    id: "status",
    accessorKey: "status",
    header: () => "Status",
    cell: (info) => getDisplayStatus(info.getValue()),
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
    header: () => "File",
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
        </div>
      );
    },
  },
];
