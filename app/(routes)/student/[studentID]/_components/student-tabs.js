import ApplicationsTable from "@/components/applications-table";
import { columns } from "@/components/columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

const StudentTabs = ({ data }) => {
  return (
    <Tabs
      defaultValue="user-details"
      className="flex flex-col items-start px-4"
    >
      <TabsList>
        <TabsTrigger value="user-details">User Details</TabsTrigger>
        <TabsTrigger value="applications">Applications</TabsTrigger>
      </TabsList>
      <TabsContent value="user-details" className="w-full">
        <div className="space-y-4 mt-4">
          <div className="w-full space-y-3 pb-4">
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">ID</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.id}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">Title</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.title}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">First Name</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.firstName}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">Last Name</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.lastName}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">Date of Birth</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {formatDate(data.dateOfBirth)}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">Gender</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.gender}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">
                  Address Line 1
                </p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.addressLine1}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">
                  Address Line 2
                </p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.addressLine2}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">City</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.city}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">Postcode</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.postcode}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">
                  Home Telephone No.
                </p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.homeTelephoneNo}
              </p>
            </div>
            <div className="flex gap-3 bg-zinc-100 items-center py-3">
              <div className="flex items-start w-full max-w-[25%] pl-3">
                <p className="uppercase font-semibold text-sm">Email</p>
              </div>
              <p className="flex flex-wrap font-medium text-black w-full">
                {data.email}
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="applications" className="w-full">
        <ApplicationsTable
          data={data.applications}
          columns={columns}
          className="border-none shadow-none"
        />
      </TabsContent>
    </Tabs>
  );
};

export default StudentTabs;
