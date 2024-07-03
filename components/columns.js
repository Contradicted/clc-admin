"use client";

import Link from "next/link";

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
    header: () => "Status",
    cell: (info) => info.getValue(),
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
