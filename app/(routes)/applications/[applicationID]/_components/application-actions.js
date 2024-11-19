"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadFiles } from "@/lib/download";
import { exportApplicationToCSV } from "@/lib/export";

const Actions = ({ data }) => {
  console.log(data);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="flex items-center cursor-pointer rounded-sm px-2 py-1.5 focus:bg-accent focus:text-accent-foreground text-sm"
          onClick={() => exportApplicationToCSV(data)}
        >
          Export
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer rounded-sm px-2 py-1.5 focus:bg-accent focus:text-accent-foreground text-sm"
          onClick={() => downloadFiles(data)}
        >
          Download Files
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
