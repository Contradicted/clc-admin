import { formatDateTime, getDisplayStatus } from "@/lib/utils";

const ApplicationHeader = ({
  applicationID,
  studentID,
  emailTimestamp,
  status,
}) => {
  return (
    <div className="flex gap-10 items-center mb-4">
      <div className="flex flex-col">
        <span className="text-slate-600 text-xs">Application ID</span>
        <span className="text-black text-sm font-medium">{applicationID}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-600 text-xs">Student ID</span>
        <span className="text-black text-sm font-medium">{studentID}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-600 text-xs">Email sent</span>
        <span className="text-black text-sm font-medium">
          {formatDateTime(emailTimestamp)}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-600 text-xs">Status</span>
        <span className="text-black text-sm font-medium">
          {getDisplayStatus(status)}
        </span>
      </div>
    </div>
  );
};

export default ApplicationHeader;
