import DefaultLayout from "@/components/default-layout";
import ExportCard from "@/components/export-card";
import ExportFiles from "@/components/export-files";
import ExportApplicationDetails from "@/components/export-application-details";
import ExportFinance from "@/components/export-finance";
import ExportInterviews from "@/components/export-interviews";
import { getActiveCourses } from "@/data/course";
import { db } from "@/lib/db";
import ExportAwardingBody from "@/components/export-awarding-body";
import ExportAttendance from "@/components/export-attendance";

export default async function ExportPage() {
  const applications = await db.application.findMany({
    include: {
      qualifications: true,
      pendingQualifications: true,
      workExperience: true,
      paymentPlan: true,
      enrolledStudent: true,
      course: {
        include: {
          course_instances: {
            select: {
              availability: true,
            },
          },
        },
      },
    },
    orderBy: {
      firstName: "asc",
    },
  });

  const interviews = await db.applicationInterview.findMany({
    include: {
      application: {
        include: {
          user: true,
        },
      },
    },
  });

  const courses = await getActiveCourses();

  return (
    <DefaultLayout>
      <div className="grid grid-cols-1 gap-6">
        <ExportCard data={applications} />
        <ExportFiles data={applications} courses={courses} />
        <ExportFinance data={applications} courses={courses} />
        <ExportInterviews interviews={interviews} courses={courses} />
        <ExportApplicationDetails data={applications} courses={courses} />
        <ExportAwardingBody data={applications} courses={courses} />
        <ExportAttendance courses={courses} />
      </div>
    </DefaultLayout>
  );
}
