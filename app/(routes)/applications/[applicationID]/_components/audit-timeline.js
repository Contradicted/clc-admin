"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { TimelineComponent } from "@/components/comp-539";

const AuditTimeline = ({ applicationID, data }) => {
  // Sort by date in descending order and take only the 3 most recent entries
  const recentItems = [...data].sort((a, b) => b.date - a.date).slice(0, 3);

  return (
    <div className="w-full h-fit rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center justify-between p-4 border-b border-stroke">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-semibold text-black dark:text-white">
            Activity Log
          </h4>
          <span className="size-6 flex items-center justify-center text-xs font-medium rounded-full bg-gray/80 text-gray-700">
            {data.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-stroke">
        {/* Use the TimelineComponent with limited items, no pagination, and truncated text */}
        <TimelineComponent
          data={recentItems}
          showPagination={false}
          truncateText={true}
        />

        {/* Link to full activity log */}
        {data.length > 3 && (
          <div className="p-4 hover:bg-gray-50/50 transition-colors">
            <Link
              href={`/applications/${applicationID}/activity`}
              className="flex items-center justify-center gap-2 text-sm font-medium text-gray-900 hover:text-primary"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTimeline;

export const ActivityPage = ({ data }) => {
  return (
    <div className="w-full h-fit rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="divide-y divide-stroke">
        {/* Full activity page shows complete text without truncation */}
        <TimelineComponent data={data} truncateText={false} />
      </div>
    </div>
  );
};