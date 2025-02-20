import DefaultLayout from "@/components/default-layout";
import { getCourseByID } from "@/data/course";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import NameForm from "./_components/name-form";
import CodeForm from "./_components/code-form";
import DescriptionForm from "./_components/description-form";
import CreditsForm from "./_components/credits-form";
import AwardingBodyForm from "./_components/awarding-body-form";
import LevelForm from "./_components/level-form";
import DatesForm from "./_components/dates-form";
import StudyModeForm from "./_components/study-mode-form";
import { cn } from "@/lib/utils";
import Actions from "./_components/actions";
import ModulesForm from "./_components/modules-form";
import { Badge } from "@/components/ui/badge";
import AvailabilityForm from "./_components/availability-form";

const CourseIDPage = async ({ params }) => {
  const course = await getCourseByID(params.courseID);

  if (!course) {
    return redirect("/courses");
  }

  // Check if any instance is On Demand
  const hasOnDemandInstance = course.course_instances.some(
    instance => instance.instance_name === "On Demand"
  );

  // For On Demand courses, we don't require date fields
  const requiredFields = [
    course.name,
    course.code,
    course.description,
    course.credits,
    course.awarding_body,
    course.level,
    // Only check date fields if there's no On Demand instance
    ...(!hasOnDemandInstance && course.course_instances.length > 0 ? [
      course.course_instances.every(instance => instance.start_date),
      course.course_instances.every(instance => instance.last_join_date),
      course.course_instances.every(instance => instance.end_date),
      course.course_instances.every(instance => instance.results_date),
    ] : []),
    // Always require at least one instance, study mode, and module
    course.course_study_mode.length > 0,
    course.modules.length > 0,
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionPercentage = (completedFields / totalFields) * 100;
  const isComplete = requiredFields.every(Boolean);

  return (
    <DefaultLayout>
      <div className="mb-6 flex flex-col gap-3">
        <Link
          href="/courses"
          className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to courses
        </Link>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-title-md2 font-semibold text-black dark:text-white">
              {`${course.name} (${course.code})`}
            </h2>
            {hasOnDemandInstance && (
              <Badge variant="secondary">On Demand Available</Badge>
            )}
          </div>
          <Actions
            disabled={!isComplete}
            isActive={course.status === "Active"}
            courseID={course.id}
          />
        </div>
        <div className="space-y-1">
          <span
            className={cn(
              "text-sm text-orange-400 italic",
              completionPercentage === 100 &&
                "text-emerald-500 font-medium italic"
            )}
          >
            {`${Math.round(completionPercentage)}% completed`}
            {Math.round(completionPercentage) !== 100 &&
              ` (${completedFields} / ${totalFields})`}
          </span>
          {hasOnDemandInstance && (
            <p className="text-xs text-muted-foreground">
              Date fields are optional for On Demand courses
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-9 md:grid-cols-2">
        <div>
          <CodeForm initialData={course} courseID={course.id} />
          <NameForm initialData={course} courseID={course.id} />
          <DescriptionForm initialData={course} courseID={course.id} />
          <CreditsForm initialData={course} courseID={course.id} />
          <AwardingBodyForm initialData={course} courseID={course.id} />
          <LevelForm initialData={course} courseID={course.id} />
        </div>
        <div className="space-y-6">
          <DatesForm
            initialData={course.course_instances}
            courseID={course.id}
            isOnDemand={hasOnDemandInstance}
          />
          <StudyModeForm
            initialData={course.course_study_mode}
            courseID={course.id}
          />
          <ModulesForm initialData={course.modules} courseID={course.id} />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CourseIDPage;
