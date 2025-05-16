import { Button } from "@/components/ui/button";
import { calculateAge, formatDateTime, getDisplayStatus } from "@/lib/utils";
import Actions from "./application-actions";

const ApplicationHeader = ({
  data,
  applicationID,
  enrolledStudent,
  studentID,
  emailTimestamp,
  status,
}) => {
   // Get age from date of birth
   const age = data?.dateOfBirth ? calculateAge(data.dateOfBirth) : 0;

   // Determine traffic light color based on age
   const getAgeIndicatorColor = () => {
     if (age >= 50) return "bg-meta-1"; // Red for age 50+
     if (age >= 35) return "bg-amber-500"; // Amber for age 35-49
     return "bg-green-500"; // Green for everyone else
   };

  return (
    <div className="flex gap-10 items-center mb-4">
      <div className="flex flex-col">
        <span className="text-slate-600 text-xs">Application ID</span>
        <span className="text-black text-sm font-medium">{applicationID}</span>
      </div>
      {enrolledStudent ? (
        <div className="flex gap-x-10">
          <div className="flex flex-col">
            <span className="text-slate-600 text-xs">User ID</span>
            <span className="text-black text-sm font-medium">{studentID}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-600 text-xs">Student ID</span>
            <span className="text-black text-sm font-medium">
              {enrolledStudent.id}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
        <span className="text-slate-600 text-xs">User ID</span>
        <span className="text-black text-sm font-medium">{studentID}</span>
      </div>
      )}
      <div className="flex flex-col">
        <span className="text-slate-600 text-xs">Email sent</span>
        <span className="text-black text-sm font-medium">
          {formatDateTime(emailTimestamp).dateTime}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-600 text-xs">Status</span>
        <span className="text-black text-sm font-medium">
          {getDisplayStatus(status)}
        </span>
      </div>
      {data?.dateOfBirth && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${getAgeIndicatorColor()}`}
            ></div>
          </div>
        </div>
      )}
      <div className="ml-auto flex items-center>">
        <Actions data={data} />
      </div>
    </div>
  );
};

export default ApplicationHeader;
