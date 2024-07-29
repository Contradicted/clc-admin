"use client";

import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

const ApplicationsTable = ({ data, columns, className }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div
      className={cn(
        "rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6",
        className
      )}
    >
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-gray-2 text-left dark:bg-meta-4"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11"
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
                    className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationsTable;
