"use client";

import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

const FilesTable = ({ data, columns, className }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="w-full">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr
            key={headerGroup.id}
            className="bg-gray-2 text-left dark:bg-meta-4"
          >
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="py-4 font-medium text-black dark:text-white xl:pl-11"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={cn(
                  "border-b border-[#eee] px-4 py-5 truncate pl-9 dark:border-strokedark xl:pl-11",
                  cell.column.id === "file" && "max-w-[280px]"
                )}
              >
                {/* {JSON.stringify(cell.column)} */}
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FilesTable;
