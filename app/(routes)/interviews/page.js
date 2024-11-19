import DefaultLayout from "@/components/default-layout";
import { db } from "@/lib/db";
import ApplicationsTable from "@/components/data-table";
import { interviewColumns } from "@/components/columns";

const InterviewsPage = async () => {
  const interviews = await db.applicationInterview.findMany({
    orderBy: [
      // Upcoming interviews first (where status is null or pending)
      // Then sort by date
      {
        date: "desc",
      },
    ],
    include: {
      application: {
        include: {
          user: true,
        },
      },
    },
  });

  // Process interviews to add student info
  const processedInterviews = interviews.map((interview) => ({
    ...interview,
    studentName: `${interview.application.user.firstName} ${interview.application.user.lastName}`,
  }));

  return (
    <DefaultLayout>
      <ApplicationsTable
        data={processedInterviews}
        columns={interviewColumns}
        type="interviews"
      />
    </DefaultLayout>
  );
};

export default InterviewsPage;
