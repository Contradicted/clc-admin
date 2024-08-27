"use client";

import { formatDate, getDisplayStatus } from "@/lib/utils";
import Link from "next/link";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";

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

export const fileColumns = [
  {
    id: "file",
    accessorKey: "name",
    header: () => "File",
    cell: (info) => {
      return <Button variant="outline">{info.getValue()}</Button>;
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
      return (
        <Button variant="ghost">
          <Trash2 className="size-4" />
        </Button>
      );
    },
  },
];
