import DefaultLayout from "@/components/default-layout";
import ExportCard from "@/components/export-card";
import ExportFiles from "@/components/export-files";
import ExportApplicationDetails from "@/components/export-application-details";
import ExportFinance from "@/components/export-finance";
import { getActiveCourses } from "@/data/course";
import { db } from "@/lib/db";
import ExportAwardingBody from "@/components/export-awarding-body";

export default async function ExportPage() {
  const applications = await db.application.findMany({
    include: {
      qualifications: true,
      pendingQualifications: true,
      workExperience: true,
      paymentPlan: true,
      enrolledStudent: true
    },
    orderBy: {
      firstName: "asc",
    },
  });

  const courses = await getActiveCourses();

  return (
    <DefaultLayout>
      <div className="grid grid-cols-1 gap-6">
        <ExportCard data={applications} />
        <ExportFiles data={applications} courses={courses} />
        <ExportFinance data={applications} courses={courses} />
        <ExportApplicationDetails data={applications} courses={courses} />
        <ExportAwardingBody data={applications} courses={courses} />
      </div>
    </DefaultLayout>
  );
}
