"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { downloadFiles } from "@/lib/download";
import { exportApplicationToCSV } from "@/lib/export";
import { useRouter } from "next/navigation";

const Actions = ({ data }) => {
  const { user } = useCurrentUser();
  const router = useRouter();

  if (!user || user.role !== "Admin") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="flex items-center cursor-pointer rounded-sm px-2 py-1.5 focus:bg-accent focus:text-accent-foreground text-sm"
          onClick={async () => {
            // Ensure data is available before proceeding
            if (!data || !data.id) {
              console.error(
                "Application data is missing. Cannot proceed with export and logging."
              );
              // Optionally, show a toast notification to the user
              return;
            }

            try {
              // Export the application data (client-side)
              exportApplicationToCSV(data);

              // Log the export activity using the server action
              const logResult = await logExportActivity(user.id, data.id);

              if (logResult?.success) {
                router.refresh(); // Re-fetch data and update UI
              } else {
                console.error(
                  "Failed to log export activity:",
                  logResult?.error
                );
                // Optionally, show a toast notification to the user about the logging failure
              }
            } catch (error) {
              console.error("Error during export or logging process:", error);
              // Optionally, show a toast notification to the user
            }
          }}
        >
          Export
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer rounded-sm px-2 py-1.5 focus:bg-accent focus:text-accent-foreground text-sm"
          onClick={async () => {
            // Ensure data is available before proceeding
            if (!data || !data.id) {
              console.error(
                "Application data is missing. Cannot proceed with download and logging."
              );
              return;
            }

            try {
              // Download the files (client-side)
              downloadFiles(data);

              // Log the download activity using the server action
              const logResult = await logDownloadActivity(user.id, data.id);

              if (logResult?.success) {
                router.refresh(); // Re-fetch data and update UI
              } else {
                console.error(
                  "Failed to log download activity:",
                  logResult?.error
                );
              }
            } catch (error) {
              console.error("Error during download or logging process:", error);
            }
          }}
        >
          Download Files
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
