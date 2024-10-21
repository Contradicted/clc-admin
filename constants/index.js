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
  { label: "ID", value: "id", id: "field_id" },
  { label: "Course Title", value: "courseTitle", id: "field_courseTitle" },
  { label: "Study Mode", value: "studyMode", id: "field_studyMode" },
  { label: "Title", value: "title", id: "field_personalTitle" },
  { label: "First Name", value: "firstName", id: "field_firstName" },
  { label: "Last Name", value: "lastName", id: "field_lastName" },
  { label: "Gender", value: "gender", id: "field_gender" },
  { label: "Date of Birth", value: "dateOfBirth", id: "field_dateOfBirth" },
  { label: "Place of Birth", value: "placeOfBirth", id: "field_placeOfBirth" },
  {
    label: "Country of Birth",
    value: "countryOfBirth",
    id: "field_countryOfBirth",
  },
  {
    label: "Passport / National ID Card No.",
    value: "identificationNo",
    id: "field_identificationNo",
  },
  { label: "Nationality", value: "nationality", id: "field_nationality" },
  {
    label: "Entry Date to UK",
    value: "entryDateToUK",
    id: "field_entryDateToUK",
  },
  {
    label: "Immigration Status",
    value: "immigration_status",
    id: "field_immigrationStatus",
  },
  { label: "Share Code", value: "share_code", id: "field_shareCode" },
  { label: "Address Line 1", value: "addressLine1", id: "field_addressLine1" },
  { label: "Address Line 2", value: "addressLine2", id: "field_addressLine2" },
  { label: "City", value: "city", id: "field_city" },
  { label: "Zip / Postal Code", value: "postcode", id: "field_postcode" },
  { label: "Email", value: "email", id: "field_email" },
  { label: "Mobile No.", value: "mobileNo", id: "field_mobileNo" },
  {
    label: "Emergency Contact Name",
    value: "emergency_contact_name",
    id: "field_emergencyContactName",
  },
  {
    label: "Emergency Contact No.",
    value: "emergency_contact_no",
    id: "field_emergencyContactNo",
  },
  { label: "Tuition Fee", value: "tuitionFees", id: "field_tuitionFees" },
  {
    label: "Is English Your First Language",
    value: "isEnglishFirstLanguage",
    id: "field_isEnglishFirstLanguage",
  },
  {
    label: "Qualification Title",
    value: "title",
    id: "field_qualificationTitle",
  },
  {
    label: "Examining Body",
    value: "examiningBody",
    id: "field_examiningBody",
  },
  { label: "Date Awarded", value: "dateAwarded", id: "field_dateAwarded" },
  {
    label: "Do you have any pending qualifications?",
    value: "hasPendingResults",
    id: "field_hasPendingResults",
  },
  {
    label: "(Pending) Qualification Title",
    value: "title",
    id: "field_pendingQualificationTitle",
  },
  {
    label: "(Pending) Examining Body",
    value: "examiningBody",
    id: "field_pendingExaminingBody",
  },
  {
    label: "(Pending) Date of Results",
    value: "dateOfResults",
    id: "field_dateOfResults",
  },
  {
    label: "(Pending) Subjects Passed",
    value: "subjectsPassed",
    id: "field_subjectsPassed",
  },
  {
    label: "Do you have any work experience?",
    value: "hasWorkExperience",
    id: "field_hasWorkExperience",
  },
  { label: "Job Title", value: "title", id: "field_jobTitle" },
  {
    label: "Name of Organisation",
    value: "nameOfOrganisation",
    id: "field_nameOfOrganisation",
  },
  { label: "Nature of Job", value: "natureOfJob", id: "field_natureOfJob" },
  { label: "Job Start Date", value: "jobStartDate", id: "field_jobStartDate" },
  { label: "Job End Date", value: "jobEndDate", id: "field_jobEndDate" },
  {
    label: "Do you have any special needs?",
    value: "specialNeeds",
    id: "field_specialNeeds",
  },
  {
    label: "Reasons for choosing this course",
    value: "reasonsForChoosingProgram",
    id: "field_reasonsForChoosingProgram",
  },
  {
    label: "What are your future educational plans?",
    value: "futureEduPlans",
    id: "field_futureEduPlans",
  },
  {
    label: "What employment do you intend to pursue after your studies?",
    value: "intentedEmployment",
    id: "field_intentedEmployment",
  },
  {
    label: "Do you have any criminal convictions?",
    value: "criminalRecord",
    id: "field_criminalRecord",
  },
  { label: "Hobbies and Interests", value: "hobbies", id: "field_hobbies" },
  { label: "Ethnic Origin", value: "ethnicity", id: "field_ethnicity" },
  { label: "Religion", value: "religion", id: "field_religion" },
  {
    label: "How did you hear about the college?",
    value: "marketing",
    id: "field_marketing",
  },
  {
    label: "Name of Recruitment Agent",
    value: "recruitment_agent",
    id: "field_recruitmentAgent",
  },
  { label: "Date of Submission", value: "createdAt", id: "field_createdAt" },
];

export const departments = [
  "Human Resources (HR)",
  "Finance",
  "Marketing",
  "Sales",
  "Customer Service",
  "Information Technology (IT)",
  "Research and Development (R&D)",
  "Operations",
  "Legal",
  "Procurement",
  "Logistics",
  "Quality Assurance (QA)",
  "Engineering",
  "Product Management",
  "Design",
  "Public Relations (PR)",
  "Administration",
  "Business Development",
  "Training and Development",
  "Health and Safety",
  "Compliance",
  "Data Analytics",
  "Support Services",
  "Facility Management",
  "Innovation",
  "Strategy",
  "Account Management",
  "Supply Chain Management",
  "Content Creation",
  "Executive Management",
  "Customer Success",
  "Sustainability",
  "Investor Relations",
  "Risk Management",
  "Security",
  "Corporate Affairs",
  "Community Relations",
  "Technical Support",
  "Design and Branding",
  "Sales Operations",
  "Talent Acquisition",
  "Employee Relations",
  "Business Intelligence",
  "Legal Compliance",
  "Environmental Health and Safety (EHS)",
  "Manufacturing",
  "Electronics/Hardware",
  "Biomedical",
  "Pharmaceuticals",
  "Education and Training",
];

export const ethnicities = [
  { label: "African", value: "black_african" },
  { label: "Any other Asian background", value: "asian_other" },
  { label: "Any other White background", value: "white_other" },
  { label: "Arab", value: "arab" },
  {
    label: "Asian or Asian British - Bangladeshi",
    value: "asian_or_asian_british_bangladeshi",
  },
  {
    label: "Asian or Asian British - Indian",
    value: "asian_or_asian_british_indian",
  },
  {
    label: "Asian or Asian British - Pakistani",
    value: "asian_or_asian_british_pakistani",
  },
  {
    label: "Black or Black British - African",
    value: "black_or_black_british_african",
  },
  {
    label: "Black or Black British - Caribbean",
    value: "black_or_black_british_caribbean",
  },
  { label: "Caribbean", value: "black_caribbean" },
  { label: "Chinese", value: "asian_chinese" },
  { label: "Gypsy or Traveller", value: "gypsy_traveller" },
  { label: "Irish", value: "white_irish" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
  { label: "White and Asian", value: "mixed_white_asian" },
  { label: "White and Black African", value: "mixed_white_black_african" },
  { label: "White and Black Caribbean", value: "mixed_white_black_caribbean" },
  {
    label: "White Welsh, Scottish or British",
    value: "white_british",
  },
];

export const religions = [
  { label: "Baháʼí Faith", value: "bahai" },
  { label: "Buddhism", value: "buddhism" },
  { label: "Christianity", value: "christianity" },
  { label: "Hinduism", value: "hindu" },
  { label: "Islam", value: "islam" },
  { label: "Judaism", value: "judaism" },
  { label: "No religion", value: "no_religion" },
  { label: "Pagan", value: "pagan" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
  { label: "Sikhism", value: "sikhism" },
];

export const marketing = [
  {
    label: "Newspaper/Magazine",
    value: "Newspaper/Magazine",
  },
  {
    label: "Relative/Friend",
    value: "Relative/Friend",
  },
  {
    label: "Google",
    value: "Google",
  },
  {
    label: "Facebook",
    value: "Facebook",
  },
  {
    label: "Recruitment Agent",
    value: "Recruitment Agent",
  },
];

export const popularCountries = ["United Kingdom", "Bangladesh", "Romania"];

export const popularNationalities = ["British", "Bangladeshi", "Romanian"];
