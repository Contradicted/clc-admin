import DefaultLayout from "@/components/default-layout";
import { InfoCard } from "@/components/info-card";
import { getDashboardStats } from "@/data/application";
import { currentUser } from "@/lib/auth";

export default async function Home() {
  const { firstName } = await currentUser();
  const stats = await getDashboardStats();

  return (
    <DefaultLayout className="max-w-none">
      <h1 className="text-2xl font-semibold mb-6">Welcome, {firstName}!</h1>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((data, index) => (
          <InfoCard
            key={index}
            status={data.status}
            totalCount={data.totalCount}
            courses={data.courses}
          />
        ))}
      </div>
    </DefaultLayout>
  );
}
