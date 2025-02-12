import DefaultLayout from "@/components/default-layout";
import { db } from "@/lib/db";
import MessagesInterface from "./_components/messages-interface";
import MessageHistory from "./_components/message-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MessagesPage() {
  const enrolledStudents = await db.enrolledStudent.findMany({
    include: {
      application: {
        include: {
          course: {
            include: {
              course_instances: true,
            },
          },
          user: true,
        },
      },
    },
    orderBy: [
      {
        application: {
          user: {
            firstName: "asc",
          },
        },
      },
      {
        application: {
          user: {
            lastName: "asc",
          },
        },
      },
    ],
  });

  // Only get active courses
  const courses = await db.course.findMany({
    where: {
      status: "Active",
    },
    include: {
      course_instances: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get all course instances from active courses
  const courseInstances = courses
    .flatMap((course) =>
      course.course_instances.map((instance) => ({
        id: instance.id,
        name: instance.instance_name,
        courseId: course.id,
        courseName: course.name,
      }))
    )
    .sort((a, b) => {
      // Parse dates from instance names (e.g., "January 2025")
      const dateA = new Date(a.name);
      const dateB = new Date(b.name);
      return dateB - dateA; // Sort descending
    });

  // Get recent messages
  const messages = await db.message.findMany({
    take: 100,
    orderBy: {
      sentAt: "desc",
    },
    include: {
      student: {
        include: {
          application: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-screen-xl">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="p-4 sm:p-6 xl:p-9">
            <Tabs defaultValue="send" className="space-y-4">
              <TabsList>
                <TabsTrigger value="send">Send Messages</TabsTrigger>
                <TabsTrigger value="history">Message History</TabsTrigger>
              </TabsList>
              <TabsContent value="send" className="space-y-4">
                <MessagesInterface
                  students={enrolledStudents}
                  courses={courses}
                  courseInstances={courseInstances}
                />
              </TabsContent>
              <TabsContent value="history">
                <MessageHistory messages={messages} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
