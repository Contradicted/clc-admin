import ApplicationsTable from "@/components/applications-table";
import { columns } from "@/components/columns";
import DefaultLayout from "@/components/default-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { Suspense } from "react";

export default async function ApplicationsPage() {
  const applications = await db.application.findMany();

  return (
    <DefaultLayout>
      <Suspense fallback={<Skeleton className="h-7 w-52" />}>
        <ApplicationsTable data={applications} columns={columns} />
      </Suspense>
    </DefaultLayout>
  );
}
