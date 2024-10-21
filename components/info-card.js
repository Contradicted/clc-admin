import {
  BarChart2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
} from "lucide-react";

import { cn } from "@/lib/utils";

const statusConfig = {
  Submitted: {
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    icon: Send,
    displayText: "Submitted",
  },
  Approved: {
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    icon: CheckCircle,
    displayText: "Approved",
  },
  Rejected: {
    color: "text-[#e12121]",
    bgColor: "bg-[#ffe1e1]",
    borderColor: "border-[#fea3a3]",
    icon: XCircle,
    displayText: "Rejected",
  },
  Waiting_for_Change: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
    icon: AlertCircle,
    displayText: "Revision",
  },
  Re_Submitted: {
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    icon: RefreshCw,
    displayText: "Re-Submitted",
  },
};

export const InfoCard = ({ status, totalCount, courses }) => {
  const config = statusConfig[status] || statusConfig.Submitted;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-md overflow-hidden",
        "border-2",
        config.borderColor
      )}
    >
      <div className={cn("p-4", config.bgColor)}>
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className={cn("size-7", config.color)} />
            <h3 className={cn("text-lg font-semibold", config.color)}>
              {config.displayText}
            </h3>
          </div>
          <p className={cn("text-2xl font-bold", config.color)}>{totalCount}</p>
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">
          Course Breakdown
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {courses.map((course, index) => (
            <div
              key={index}
              className="flex justify-between items-center text-sm"
            >
              <p
                className="text-gray-600 truncate max-w-[80%]"
                title={course.courseTitle}
              >
                {course.courseTitle}
              </p>
              <p className={cn("font-medium", config.color)}>{course.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
