import DefaultLayout from "@/components/default-layout";
import ExportCard from "@/components/export-card";
import { db } from "@/lib/db";

export default async function ExportPage() {
  const applications = await db.application.findMany({
    include: {
      qualifications: true,
      pendingQualifications: true,
      workExperience: true,
    },
    orderBy: {
      firstName: "asc",
    },
  });

  return (
    <DefaultLayout>
      <div className="grid grid-cols-1">
        <ExportCard data={applications} />
      </div>
    </DefaultLayout>
  );
}
