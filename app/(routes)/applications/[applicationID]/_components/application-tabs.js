import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import CourseDetails from "./course-details";
import PersonalDetails from "./personal-details";
import QualificationDetails from "./qualification-details";
import WorkExperienceDetails from "./work-experience-details";
import AdditionalDetails from "./additional-details";

const ApplicationTabs = ({ data, className }) => {
  return (
    <Tabs
      defaultValue="course-details"
      className={cn("flex flex-col items-start px-4", className)}
    >
      <TabsList className="w-full gap-x-3">
        <TabsTrigger value="course-details">Course Details</TabsTrigger>
        <TabsTrigger value="personal-details">Personal Details</TabsTrigger>
        <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
        <TabsTrigger value="work-experience">Work Experience</TabsTrigger>
        <TabsTrigger value="additional-information">
          Additional Information
        </TabsTrigger>
      </TabsList>
      <TabsContent value="course-details" className="w-full">
        <CourseDetails
          courseTitle={data.courseTitle}
          studyMode={data.studyMode}
        />
      </TabsContent>
      <TabsContent value="personal-details" className="w-full">
        <PersonalDetails application={data} />
      </TabsContent>
      <TabsContent value="qualifications" className="w-full">
        <QualificationDetails application={data} />
      </TabsContent>
      <TabsContent value="work-experience" className="w-full">
        <WorkExperienceDetails application={data} />
      </TabsContent>
      <TabsContent value="additional-information" className="w-full">
        <AdditionalDetails application={data} />
      </TabsContent>
    </Tabs>
  );
};

export default ApplicationTabs;
