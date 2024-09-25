import { getCourses } from "@/data/course";

export const DEFAULT_INTERVIEW_QUESTIONS = [
  {
    id: 1,
    value: "work_study_experience",
    text: "Describe your work/study experience",
  },
  {
    id: 2,
    value: "has_eng_lang_qualification",
    text: "Does the candidate have the required English Language qualification? [Yes=1, No=0]",
  },
  {
    id: 3,
    value: "health_social_care",
    text: "From your own knowledge, what do you think working in health and social care entails?",
  },
  {
    id: 4,
    value: "extra_curricular_activities",
    text: "Tell us about your extra-curricular activities (eg. sports, debates, including any voluntary work etc)",
  },
  {
    id: 5,
    value: "delivered_good_care",
    text: "Drawing on your own health and social care experience, tell me about a time you felt you delivered good care. Explain why",
  },
  {
    id: 6,
    value: "strengths_weaknesses",
    text: "What are your strengths and weaknesses",
  },
  {
    id: 7,
    value: "adequacy_of_candidate",
    text: "If the answer to the above question is [N/A], please confirm how you ensured the adequacy of the candidate",
  },
  {
    id: 8,
    value: "challenging_situation",
    text: "Tell me about a time you were involved in a challenging situtation. How did you respond to this and would you respond differently to improve the outcome?",
  },
  { id: 9, value: "prioritise_work", text: "How do you prioritise your work?" },
  {
    id: 10,
    value: "challenges_in_health_social_care",
    text: "What challenges do you think the health and social care sector currently face",
  },
  {
    id: 11,
    value: "reason_for_qualification",
    text: "Why did you choose this qualification?",
  },
  {
    id: 12,
    value: "qualities_skills_to_study",
    text: "What qualities and skills will you bring to your chosen programme of study?",
  },
  {
    id: 13,
    value: "programme_of_study",
    text: "Tell us more about your chosen programme of study",
  },
  {
    id: 14,
    value: "preparing_for_interview",
    text: "How did you prepare for your interview? What did you learn from your reading?",
  },
  {
    id: 15,
    value: "goal",
    text: "What is your goal? Or what do you want to achieve in the next 2-5 years",
  },
  {
    id: 16,
    value: "qualification_goal",
    text: "How is this qualification going to help you in achieving your goal(s)?",
  },
  {
    id: 17,
    value: "scenario_question",
    text: "Scenario Question: What are the different means of transportation and major difficulties involved in planning for a journey?",
  },
  {
    id: 18,
    value: "interviewer_confirm",
    text: "Interviewer confirms candidate has explained details of the programme applied, attendance, terms and conditions and the college's right to suspend the candidate due to academic progression",
  },
  {
    id: 19,
    value: "clarity_of_candidate",
    text: "Rate the clarity and structure of candidate",
  },
  { id: 20, value: "interviewer_name", text: "Interviewer's name" },
  { id: 21, value: "notes", text: "Interviewer's Notes" },
];

export const Statuses = [
  {
    value: "Submitted",
    label: "Submitted",
  },
  {
    value: "Approved",
    label: "Approved",
  },
  {
    value: "Rejected",
    label: "Rejected",
  },
  {
    value: "Waiting_For_Change",
    label: "Waiting for Change",
  },
  {
    value: "Re_Submitted",
    label: "Re-Submitted",
  },
  {
    value: "Approved_for_Interview",
    label: "Approved for Interview",
  },
  {
    value: "Interview_successful",
    label: "Interview Successful",
  },
  {
    value: "Unfinished",
    label: "Unfinished",
  },
  {
    value: "Finished",
    label: "Finished",
  },
  {
    value: "Void",
    label: "Void",
  },
];

export const applicationHeaders = [
  {
    label: "ID",
    value: "id",
  },
  {
    label: "Course Title",
    value: "courseTitle",
  },
  {
    label: "Study Mode",
    value: "studyMode",
  },
  {
    label: "Title",
    value: "title",
  },
  {
    label: "First Name",
    value: "firstName",
  },
  {
    label: "Last Name",
    value: "lastName",
  },
  {
    label: "Gender",
    value: "gender",
  },
  {
    label: "Date of Birth",
    value: "dateOfBirth",
  },
  {
    label: "Place of Birth",
    value: "placeOfBirth",
  },
  {
    label: "Country of Birth",
    value: "countryOfBirth",
  },
  {
    label: "Passport / National ID Card No.",
    value: "identificationNo",
  },
  {
    label: "Nationality",
    value: "nationality",
  },
  {
    label: "Entry Date to UK",
    value: "entryDateToUK",
  },
  {
    label: "Immigration Status",
    value: "immigration_status",
  },
  {
    label: "Share Code",
    value: "share_code",
  },
  {
    label: "Address Line 1",
    value: "addressLine1",
  },
  {
    label: "Address Line 2",
    value: "addressLine2",
  },
  {
    label: "City",
    value: "city",
  },
  {
    label: "Zip / Postal Code",
    value: "postcode",
  },
  {
    label: "Email",
    value: "email",
  },
  {
    label: "Mobile No.",
    value: "mobileNo",
  },
  {
    label: "Tuition Fee",
    value: "tuitionFees",
  },
  {
    label: "Is English Your First Langauge",
    value: "isEnglishFirstLanguage",
  },
  {
    label: "Qualification Title",
    value: "title",
  },
  {
    label: "Examining Body",
    value: "examiningBody",
  },
  {
    label: "Date Awarded",
    value: "dateAwarded",
  },
  {
    label: "Do you have any pending qualifications?",
    value: "hasPendingResults",
  },
  {
    label: "(Pending) Qualification Title",
    value: "title",
  },
  {
    label: "(Pending) Examining Body",
    value: "examiningBody",
  },
  {
    label: "(Pending) Date of Results",
    value: "dateOfResults",
  },
  {
    label: "(Pending) Subjects Passed",
    value: "subjectsPassed",
  },
  {
    label: "Do you have any work experience?",
    value: "hasWorkExperience",
  },
  {
    label: "Job Title",
    value: "title",
  },
  {
    label: "Name of Organisation",
    value: "nameOfOrganisation",
  },
  {
    label: "Nature of Job",
    value: "natureOfJob",
  },
  {
    label: "Job Start Date",
    value: "jobStartDate",
  },
  {
    label: "Job End Date",
    value: "jobEndDate",
  },
  {
    label: "Do you have any special needs?",
    value: "specialNeeds",
  },
  {
    label: "Reasons for choosing this course",
    value: "reasonsForChoosingProgram",
  },
  {
    label: "What are your future educational plans?",
    value: "futureEduPlans",
  },
  {
    label: "What employment do you intend to pursue after your studies?",
    value: "intentedEmployment",
  },
  {
    label: "Do you have any criminal convictions?",
    value: "criminalRecord",
  },
  {
    label: "Hobbies and Interests",
    value: "hobbies",
  },
  {
    label: "Ethnic Origin",
    value: "ethnicity",
  },
  {
    label: "Religion",
    value: "religion",
  },
  {
    label: "How did you hear about the college?",
    value: "marketing",
  },
  {
    label: "Terms and Conditions",
    value: "terms",
  },
  {
    label: "Name of Recruitment Agent",
    value: "recruitment_agent",
  },
  {
    label: "Date of Submission",
    value: "createdAt",
  },
];
