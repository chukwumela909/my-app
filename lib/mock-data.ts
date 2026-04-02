// Mock data for the School Result Checker Application

export const schoolInfo = {
  name: "Goodnews International School",
  motto: "Bringing Sound Education in the fear of God to the Grassroots",
  address: "742 Evergreen Terrace, Springfield",
  logo: "/placeholder-logo.png", // We'll deal with images later or use text
  currentSession: "2026/2027",
  currentTerm: "Second Term",
  contact: {
    email: "support@springfieldhigh.edu",
    phone: "+1 (555) 012-3456"
  }
};

export const mockStudentProfile = {
  id: "ST-2023-001",
  firstName: "Alex",
  lastName: "Doe",
  admissionNumber: "ADM/2023/001",
  class: "JSS 2A",
  photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", // Placeholder avatar
  dob: "2012-05-15",
  gender: "Male"
};

export type ResultRecord = {
  subject: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
};

export const mockResults: ResultRecord[] = [
  { subject: "Mathematics", ca: 25, exam: 60, total: 85, grade: "A", remark: "Excellent" },
  { subject: "English Language", ca: 22, exam: 55, total: 77, grade: "B", remark: "Very Good" },
  { subject: "Basic Science", ca: 20, exam: 45, total: 65, grade: "C", remark: "Good" },
  { subject: "Social Studies", ca: 28, exam: 62, total: 90, grade: "A", remark: "Outstanding" },
  { subject: "Civic Education", ca: 24, exam: 50, total: 74, grade: "B", remark: "Very Good" },
  { subject: "Agricultural Science", ca: 18, exam: 40, total: 58, grade: "C", remark: "Credit" },
  { subject: "Business Studies", ca: 26, exam: 58, total: 84, grade: "A", remark: "Excellent" },
  { subject: "Computer Studies", ca: 29, exam: 68, total: 97, grade: "A", remark: "Distinction" },
];

export const mockResultSummary = {
  totalScore: 630,
  averageScore: 78.75,
  position: "4th",
  outOf: 45,
  principalComment: "An excellent performance. Keep up the good work next term!",
  principalSignature: "Dr. Skinner",
};

export const mockAdminStats = {
  totalStudents: 1250,
  activeSessions: 1,
  resultsUploaded: 850,
  classCount: 18,
};

export const mockStudentList = [
  { id: "1", name: "Alex Doe", admNo: "ADM/2023/001", class: "JSS 2A", gender: "Male" },
  { id: "2", name: "Sarah Smith", admNo: "ADM/2023/042", class: "JSS 2A", gender: "Female" },
  { id: "3", name: "Michael Johnson", admNo: "ADM/2023/015", class: "SS 1B", gender: "Male" },
  { id: "4", name: "Emily Davis", admNo: "ADM/2023/088", class: "SS 3C", gender: "Female" },
  { id: "5", name: "James Wilson", admNo: "ADM/2023/007", class: "JSS 1A", gender: "Male" },
];
