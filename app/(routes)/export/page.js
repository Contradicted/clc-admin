import DefaultLayout from "@/components/default-layout";
import ExportCard from "@/components/export-card";
import ExportFiles from "@/components/export-files";
import { getActiveCourses } from "@/data/course";
import { db } from "@/lib/db";

export default async function ExportPage() {
  const applications = await db.application.findMany({
    include: {
      qualifications: true,
      pendingQualifications: true,
      workExperience: true,
      paymentPlan: true
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
      </div>
    </DefaultLayout>
  );
}
