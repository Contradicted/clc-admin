import DefaultLayout from "@/components/default-layout";
import { InfoCard } from "@/components/info-card";
import { getDashboardApplications } from "@/data/application";
import { currentUser } from "@/lib/auth";
import {
  BookCheckIcon,
  BookXIcon,
  FileClockIcon,
  NotebookIcon,
} from "lucide-react";

export default async function Home() {
  const { firstName } = await currentUser();
  const { approved, submitted, rejected, revision } =
    await getDashboardApplications();

  return (
    <DefaultLayout className="max-w-none">
      <h1 className="text-2xl font-semibold mb-6">Welcome, {firstName}!</h1>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <InfoCard
          icon={NotebookIcon}
          title="Submitted"
          number={submitted.length}
        />
        <InfoCard
          icon={BookCheckIcon}
          title="Approved"
          number={approved.length}
        />
        <InfoCard icon={BookXIcon} title="Rejected" number={rejected.length} />
        <InfoCard
          icon={FileClockIcon}
          title="Waiting for Change"
          number={revision.length}
        />
      </div>
    </DefaultLayout>
  );
}
