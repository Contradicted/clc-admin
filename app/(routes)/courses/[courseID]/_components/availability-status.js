"use client";

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const AvailabilityStatus = ({ course_instances }) => {
  if (!course_instances || course_instances.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {course_instances.map((instance) => {
        const enrolled = instance.enrolled || 0;
        const availability = instance.availability || 0;
        const isFull = enrolled >= availability;
        
        // Format instance name
        let instanceName = "Unknown";
        if (instance.isOnDemand) {
          instanceName = "On Demand";
        } else {
          // Check if instance_name is a valid date
          const date = new Date(instance.instance_name);
          instanceName = !isNaN(date.getTime()) 
            ? format(date, "MMM yyyy") 
            : instance.instance_name || "Unknown";
        }

        return (
          <Badge
            key={instance.id}
            variant="outline"
            className={`text-sm ${
              isFull ? "border-red-500 text-red-500" : "border-emerald-500 text-emerald-500"
            }`}
          >
            {instanceName}: {enrolled}/{availability}
            {isFull ? " (FULL)" : ""}
          </Badge>
        );
      })}
    </div>
  );
};

export default AvailabilityStatus;
