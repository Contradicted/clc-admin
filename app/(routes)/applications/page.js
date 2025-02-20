import ApplicationsTable from "@/components/data-table";
import { columns } from "@/components/columns";
import DefaultLayout from "@/components/default-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourses } from "@/data/course";
import { db } from "@/lib/db";
import { Suspense } from "react";

export default async function ApplicationsPage() {
  const applications = await db.application.findMany({
    where: {
      campus: {
        in: ["London", "Bristol", "Sheffield", "Birmingham"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  
  const courses = await getCourses();

  return (
    <DefaultLayout>
      <Suspense fallback={<Skeleton className="h-7 w-52" />}>
        <ApplicationsTable
          data={applications}
          columns={columns}
          courses={courses}
        />
      </Suspense>
    </DefaultLayout>
  );
}
