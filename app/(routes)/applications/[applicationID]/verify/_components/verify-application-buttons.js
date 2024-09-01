import Link from "next/link";
import StatusModal from "./status-modal";

const VerifyApplicationButtons = ({ applicationID, applicationStatus }) => {
  return (
    <div className="flex gap-x-3">
      {["Interview_successful", "Approved"].includes(applicationStatus) ? (
        <StatusModal
          applicationID={applicationID}
          status="Approved"
          name="Approve Application"
          title="Approve Application"
          desc="Please enter a message"
          className="bg-meta-3 hover:bg-meta-3/90"
        />
      ) : (
        <StatusModal
          applicationID={applicationID}
          status="Approved_for_Interview"
          name="Approve for Interview"
          title="Approve for Interview"
          desc="Please enter a message"
          className="bg-meta-3 hover:bg-meta-3/90"
        />
      )}
      <StatusModal
        applicationID={applicationID}
        status="Rejected"
        name="Reject Application"
        title="Reject Application"
        desc="Please write your reasons to reject this application"
        className="bg-meta-1 hover:bg-meta-1/90"
      />
      <StatusModal
        applicationID={applicationID}
        status="Waiting_for_Change"
        name="Request Change"
        title="Request Change"
        desc="Please write changes that need to be made"
        className="bg-meta-8 hover:bg-meta-8/90"
      />
    </div>
  );
};

export default VerifyApplicationButtons;
