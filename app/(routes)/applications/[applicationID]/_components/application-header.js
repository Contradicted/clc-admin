const ApplicationHeader = ({ applicationID, studentID }) => {
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
    </div>
  );
};

export default ApplicationHeader;
