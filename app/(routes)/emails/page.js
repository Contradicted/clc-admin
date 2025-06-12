import DefaultLayout from "@/components/default-layout";
import EmailHistory from "./_components/email-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailsInterface from "./_components/emails-interface";
import { getCourses } from "@/data/course";
import { FileBadge } from "lucide-react";
import { db } from "@/lib/db";

// Mock data for frontend development
const mockStudentUsers = [
  { 
    id: "1", 
    firstName: "John", 
    lastName: "Doe", 
    email: "john.doe@example.com", 
    role: "Student",
    enrolledStudent: {
      id: "101",
      studentEmail: "john.doe@student.college.edu",
      application: {
        id: "1001",
        course: { id: "1", name: "Web Development" },
        campus: "Main Campus",
        commencement: "January 2025",
        user: { id: "1", firstName: "John", lastName: "Doe", email: "john.doe@example.com" }
      }
    }
  },
  { 
    id: "2", 
    firstName: "Jane", 
    lastName: "Smith", 
    email: "jane.smith@example.com", 
    role: "Student",
    enrolledStudent: {
      id: "102",
      studentEmail: "jane.smith@student.college.edu",
      application: {
        id: "1002",
        course: { id: "2", name: "Data Science" },
        campus: "Downtown Campus",
        commencement: "February 2025",
        user: { id: "2", firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com" }
      }
    }
  },
  { 
    id: "3", 
    firstName: "Michael", 
    lastName: "Johnson", 
    email: "michael.j@example.com", 
    role: "Student",
    enrolledStudent: {
      id: "103",
      studentEmail: "m.johnson@student.college.edu",
      application: {
        id: "1003",
        course: { id: "3", name: "UX Design" },
        campus: "Main Campus",
        commencement: "January 2025",
        user: { id: "3", firstName: "Michael", lastName: "Johnson", email: "michael.j@example.com" }
      }
    }
  },
  { 
    id: "4", 
    firstName: "Sarah", 
    lastName: "Williams", 
    email: "s.williams@example.com", 
    role: "Student",
    enrolledStudent: {
      id: "104",
      studentEmail: "s.williams@student.college.edu",
      application: {
        id: "1004",
        course: { id: "1", name: "Web Development" },
        campus: "Downtown Campus",
        commencement: "March 2025",
        user: { id: "4", firstName: "Sarah", lastName: "Williams", email: "s.williams@example.com" }
      }
    }
  },
  { 
    id: "5", 
    firstName: "David", 
    lastName: "Brown", 
    email: "david.brown@example.com", 
    role: "Student",
    enrolledStudent: {
      id: "105",
      studentEmail: "d.brown@student.college.edu",
      application: {
        id: "1005",
        course: { id: "2", name: "Data Science" },
        campus: "Main Campus",
        commencement: "April 2025",
        user: { id: "5", firstName: "David", lastName: "Brown", email: "david.brown@example.com" }
      }
    }
  },
  { 
    id: "6", 
    firstName: "Emily", 
    lastName: "Jones", 
    email: "emily.jones@example.com", 
    role: "Student",
    enrolledStudent: {
      id: "106",
      studentEmail: "e.jones@student.college.edu",
      application: {
        id: "1006",
        course: { id: "3", name: "UX Design" },
        campus: "Downtown Campus",
        commencement: "May 2025",
        user: { id: "6", firstName: "Emily", lastName: "Jones", email: "emily.jones@example.com" }
      }
    }
  },
  { 
    id: "7", 
    firstName: "Robert", 
    lastName: "Miller", 
    email: "r.miller@example.com", 
    role: "Student"
    // Not enrolled - no enrolledStudent property
  },
  { 
    id: "8", 
    firstName: "Jennifer", 
    lastName: "Davis", 
    email: "j.davis@example.com", 
    role: "Student"
    // Not enrolled - no enrolledStudent property
  },
  { 
    id: "9", 
    firstName: "William", 
    lastName: "Garcia", 
    email: "w.garcia@example.com", 
    role: "Student"
    // Not enrolled - no enrolledStudent property
  },
  { 
    id: "10", 
    firstName: "Elizabeth", 
    lastName: "Rodriguez", 
    email: "e.rodriguez@example.com", 
    role: "Student",
    enrolledStudent: {
      id: "110",
      studentEmail: "e.rodriguez@student.college.edu",
      application: {
        id: "1010",
        course: { id: "1", name: "Web Development" },
        campus: "Main Campus",
        commencement: "January 2025",
        user: { id: "10", firstName: "Elizabeth", lastName: "Rodriguez", email: "e.rodriguez@example.com" }
      }
    }
  },
  { 
    id: "11", 
    firstName: "James", 
    lastName: "Wilson", 
    email: "j.wilson@example.com", 
    role: "Student",
    enrolledStudent: {
      id: "111",
      studentEmail: "j.wilson@student.college.edu",
      application: {
        id: "1011",
        course: { id: "2", name: "Data Science" },
        campus: "Downtown Campus",
        commencement: "February 2025",
        user: { id: "11", firstName: "James", lastName: "Wilson", email: "j.wilson@example.com" }
      }
    }
  },
  { 
    id: "12", 
    firstName: "Patricia", 
    lastName: "Martinez", 
    email: "p.martinez@example.com", 
    role: "Student"
    // Not enrolled - no enrolledStudent property
  },
];

const mockCourses = [
  { 
    id: "1", 
    name: "Web Development", 
    status: "Active",
    course_instances: [
      { id: "101", instance_name: "January 2025" },
      { id: "102", instance_name: "March 2025" },
    ] 
  },
  { 
    id: "2", 
    name: "Data Science", 
    status: "Active",
    course_instances: [
      { id: "201", instance_name: "February 2025" },
      { id: "202", instance_name: "April 2025" },
    ] 
  },
  { 
    id: "3", 
    name: "UX Design", 
    status: "Active",
    course_instances: [
      { id: "301", instance_name: "January 2025" },
      { id: "302", instance_name: "May 2025" },
    ] 
  },
];

const mockCourseInstances = mockCourses
  .flatMap((course) =>
    course.course_instances.map((instance) => ({
      id: instance.id,
      name: instance.instance_name,
      courseId: course.id,
      courseName: course.name,
    }))
  )
  .sort((a, b) => {
    const dateA = new Date(a.name);
    const dateB = new Date(b.name);
    return dateB - dateA;
  });

const mockLetterTemplates = [
  { 
    id: "1", 
    name: "Course Completion Certificate", 
    subject: "Your Course Completion Certificate",
    content: "Dear [Student Name],\n\nCongratulations on successfully completing the [Course Name] course! We are pleased to award you with the attached certificate of completion.\n\nYour dedication and hard work throughout the course have been commendable, and we hope the knowledge and skills you've gained will serve you well in your future endeavors.\n\nBest regards,\nThe Education Team" 
  },
  { 
    id: "2", 
    name: "Payment Reminder", 
    subject: "Important: Payment Reminder",
    content: "Dear [Student Name],\n\nThis letter serves as a reminder that your tuition payment for [Course Name] is due on [Due Date].\n\nPlease ensure that your payment is made on time to avoid any late fees or disruption to your studies.\n\nIf you have already made the payment, please disregard this notice.\n\nThank you for your attention to this matter.\n\nBest regards,\nFinance Department" 
  },
  { 
    id: "3", 
    name: "Course Schedule Change", 
    subject: "Important: Change to Your Course Schedule",
    content: "Dear [Student Name],\n\nWe are writing to inform you of a change to the schedule for your [Course Name] course.\n\nEffective [Date], the course will now be held on [New Days] from [New Time].\n\nIf this new schedule presents any difficulties for you, please contact our student services team at your earliest convenience.\n\nWe apologize for any inconvenience this may cause.\n\nBest regards,\nAcademic Affairs" 
  },
];

const mockEmails = [
  {
    id: "1",
    subject: "Your Course Completion Certificate",
    content: "Dear John,\n\nCongratulations on successfully completing the Web Development course! We are pleased to award you with the attached certificate of completion.\n\nYour dedication and hard work throughout the course have been commendable, and we hope the knowledge and skills you've gained will serve you well in your future endeavors.\n\nBest regards,\nThe Education Team",
    sentAt: "2025-05-15T10:30:00Z",
    status: "sent",
    user: { firstName: "John", lastName: "Doe", email: "john.doe@example.com" }
  },
  {
    id: "2",
    subject: "Important: Payment Reminder",
    content: "Dear Jane,\n\nThis letter serves as a reminder that your tuition payment for Data Science is due on June 1, 2025.\n\nPlease ensure that your payment is made on time to avoid any late fees or disruption to your studies.\n\nIf you have already made the payment, please disregard this notice.\n\nThank you for your attention to this matter.\n\nBest regards,\nFinance Department",
    sentAt: "2025-05-20T14:15:00Z",
    status: "sent",
    user: { firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com" }
  },
  {
    id: "3",
    subject: "Important: Change to Your Course Schedule",
    content: "Dear Michael,\n\nWe are writing to inform you of a change to the schedule for your UX Design course.\n\nEffective June 15, 2025, the course will now be held on Tuesdays and Thursdays from 2:00 PM to 4:00 PM.\n\nIf this new schedule presents any difficulties for you, please contact our student services team at your earliest convenience.\n\nWe apologize for any inconvenience this may cause.\n\nBest regards,\nAcademic Affairs",
    sentAt: "2025-06-01T09:45:00Z",
    status: "sent",
    user: { firstName: "Michael", lastName: "Johnson", email: "michael.j@example.com" }
  },
  {
    id: "4",
    subject: "Course Materials Update",
    content: "Dear Sarah,\n\nWe are writing to inform you that updated course materials for your Web Development course are now available on the student portal.\n\nPlease download these materials at your earliest convenience as they contain important information that will be covered in your upcoming classes.\n\nBest regards,\nAcademic Affairs",
    sentAt: "2025-06-05T11:20:00Z",
    status: "failed",
    error: "Invalid email address",
    user: { firstName: "Sarah", lastName: "Williams", email: "s.williams@example.com" }
  },
];

export default async function LettersPage() {
  const courses = await getCourses();
  const students = await db.user.findMany({
    where: {
      role: "Student",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      applications: {
        select: {
          courseID: true,
          courseTitle: true,
          campus: true,
          commencement: true,
        }
      },
      enrolledStudent: {
        select: {
          id: true,
          office365Email: true
        }
      },
    },
  })
  
  // Fetch email logs and group them by batchId
  const emailLogs = await db.emailLog.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      recipient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  // Group emails by batchId
  const emailBatches = emailLogs.reduce((acc, log) => {
    const batchId = log.batchId || `individual-${log.id}`;
    if (!acc[batchId]) {
      acc[batchId] = {
        batchId,
        subject: log.subject,
        content: log.content,
        sender: log.sender,
        createdAt: log.createdAt,
        logs: [],
      };
    }
    acc[batchId].logs.push(log);
    return acc;
  }, {});

  const groupedEmails = Object.values(emailBatches);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-screen-xl">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="p-4 sm:p-6 xl:p-9">
            <Tabs defaultValue="send" className="space-y-4">
              <TabsList>
                <TabsTrigger value="send">Send Emails</TabsTrigger>
                <TabsTrigger value="history">Email History</TabsTrigger>
              </TabsList>
              <TabsContent value="send" className="space-y-4">
                <EmailsInterface
                  students={students}
                  courses={courses}
                  courseInstances={courses.flatMap(course => course.course_instances || [])}
                  letterTemplates={mockLetterTemplates}
                />
              </TabsContent>
              <TabsContent value="history">
                <EmailHistory emailBatches={groupedEmails} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
