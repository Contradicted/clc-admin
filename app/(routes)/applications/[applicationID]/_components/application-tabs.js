"use client";

import { useEffect, useRef, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import CourseDetails from "./course-details";
import PersonalDetails from "./personal-details";
import QualificationDetails from "./qualification-details";
import WorkExperienceDetails from "./work-experience-details";
import AdditionalDetails from "./additional-details";
import StudentFinanceDetails from "./student-finance-details";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ApplicationTabs = ({ data, courses, className }) => {
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const scrollRef = useRef(null);

  const isTuitionSLC =
    data.tuitionFees === "Student Loan Company England (SLC)";

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setIsAtStart(scrollLeft <= 10);
      setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 10);
    }
  };

  // Keyboard navigation for horizontal scrolling
  const handleKeyDown = (e) => {
    if (scrollRef.current) {
      if (e.key === "ArrowRight") {
        scrollRef.current.scrollLeft += 100;
      } else if (e.key === "ArrowLeft") {
        scrollRef.current.scrollLeft -= 100;
      }
    }
  };

  // Add scroll buttons handler
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth > 1024 ? 300 : 200;
      scrollRef.current.scrollLeft +=
        direction === "left" ? -scrollAmount : scrollAmount;
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      handleScroll();

      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const tabItems = [
    { value: "course-details", label: "Course Details" },
    { value: "personal-details", label: "Personal Details" },
    ...(isTuitionSLC
      ? [{ value: "student-finance", label: "Student Finance" }]
      : []),
    { value: "qualifications", label: "Qualifications" },
    { value: "work-experience", label: "Work Experience" },
    { value: "additional-information", label: "Additional Information" },
  ];

  console.log(isAtEnd);

  return (
    <Tabs defaultValue="course-details" className={cn("w-full", className)}>
      <div
        className="relative group"
        role="region"
        aria-label="Scrollable tabs"
      >
        {!isAtStart && (
          <>
            <div
              className="absolute left-0 top-0 h-full w-36 pointer-events-none bg-gradient-to-r from-background via-background/50 to-transparent z-20"
              aria-hidden="true"
            />
            <button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-30 cursor-pointer"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto scrollbar-hide scroll-smooth"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="tablist"
          aria-orientation="horizontal"
        >
          <TabsList className="inline-flex min-w-full max-w-maxitems-center justify-start space-x-2">
            {tabItems.map((item, index) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                role="tab"
                aria-selected={index === 0}
                aria-controls={`${item.value}-content`}
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {!isAtEnd && (
          <>
            <div
              className="absolute right-0 top-0 h-full w-36 pointer-events-none bg-gradient-to-l from-background via-background/50 to-transparent z-20"
              aria-hidden="true"
            />
            <button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-30 cursor-pointer"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        {/* Optional: Touch indicator */}
        <div className="absolute left-0 right-0 bottom-0 h-1 md:hidden">
          <div
            className="h-full w-16 bg-gradient-to-r from-transparent via-muted/20 to-transparent animate-swipe"
            aria-hidden="true"
          />
        </div>
      </div>
      <TabsContent value="course-details" className="w-full">
        <CourseDetails
          courseTitle={data.courseTitle}
          studyMode={data.studyMode}
          commencement={data.commencement}
          campus={data.campus}
          courses={courses}
          applicationID={data.id}
          ab_registration_date={data.ab_registration_date}
          ab_registration_no={data.ab_registration_no}
        />
      </TabsContent>
      <TabsContent value="personal-details" className="w-full">
        <PersonalDetails application={data} />
      </TabsContent>
      {isTuitionSLC && (
        <TabsContent value="student-finance" className="w-full">
          <StudentFinanceDetails application={data} courses={courses} />
        </TabsContent>
      )}
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
