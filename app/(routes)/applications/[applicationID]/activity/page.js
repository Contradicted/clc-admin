import { getApplicationByID } from "@/data/application";
import DefaultLayout from "@/components/default-layout";
import { redirect } from "next/navigation";
import { ActivityPage } from "../_components/audit-timeline";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getActivityLogsByApplicationID } from "@/data/activity-logs";

const ApplicationActivityPage = async ({ params }) => {
  const application = await getApplicationByID(params.applicationID);
  const activityLogs = await getActivityLogsByApplicationID(
    params.applicationID
  );

  if (!application || !activityLogs) {
    return redirect("/applications");
  }

  return (
    <DefaultLayout>
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/applications/${application.id}`}
            className="transition-all hover:opacity-80 flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to application
          </Link>
        </div>

        <h2 className="text-2xl font-bold mb-6">Activity Log</h2>

        <ActivityPage data={activityLogs} />
      </div>
    </DefaultLayout>
  );
};

export default ApplicationActivityPage;
