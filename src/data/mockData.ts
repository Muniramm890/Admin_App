// FILE: teacher-app/src/data/mockData.ts
// Source: admin App.tsx -> CLASSES [49-62], SECTIONS [63-76], CLASS_SUBJECTS [77-128], FEE_STRUCTURE [129-142], STUDENTS [144-185], TEACHERS [187-257], generateMarks [261-276], MARKS_DATA [278-278], FEES_DATA [282-313]
// @ts-nocheck

export const CLASSES = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

export const SECTIONS = {
  "Class 1": ["A", "B"],
  "Class 2": ["A", "B", "C"],
  "Class 3": ["A", "B", "C"],
  "Class 4": ["A", "B"],
  "Class 5": ["A", "B", "C"],
  "Class 6": ["A", "B", "C"],
  "Class 7": ["A", "B", "C"],
  "Class 8": ["A", "B"],
  "Class 9": ["A", "B", "C"],
  "Class 10": ["A", "B", "C"],
  "Class 11": ["Science", "Commerce", "Arts"],
  "Class 12": ["Science", "Commerce", "Arts"],
};

export const CLASS_SUBJECTS = {
  "Class 1": ["English", "Hindi", "Maths", "EVS", "Drawing"],
  "Class 2": ["English", "Hindi", "Maths", "EVS", "Drawing"],
  "Class 3": ["English", "Hindi", "Maths", "Science", "Social", "Drawing"],
  "Class 4": ["English", "Hindi", "Maths", "Science", "Social", "Drawing"],
  "Class 5": ["English", "Hindi", "Maths", "Science", "Social", "Computer"],
  "Class 6": [
    "English",
    "Hindi",
    "Maths",
    "Science",
    "Social",
    "Computer",
    "Sanskrit",
  ],
  "Class 7": [
    "English",
    "Hindi",
    "Maths",
    "Science",
    "Social",
    "Computer",
    "Sanskrit",
  ],
  "Class 8": [
    "English",
    "Hindi",
    "Maths",
    "Science",
    "Social",
    "Computer",
    "Sanskrit",
  ],
  "Class 9": ["English", "Hindi", "Maths", "Science", "Social", "Computer"],
  "Class 10": ["English", "Hindi", "Maths", "Science", "Social", "Computer"],
  "Class 11": [
    "English",
    "Physics",
    "Chemistry",
    "Maths",
    "Biology",
    "Computer",
  ],
  "Class 12": [
    "English",
    "Physics",
    "Chemistry",
    "Maths",
    "Biology",
    "Computer",
  ],
};

export const FEE_STRUCTURE = {
  "Class 1": 2500,
  "Class 2": 2500,
  "Class 3": 2800,
  "Class 4": 2800,
  "Class 5": 3000,
  "Class 6": 3200,
  "Class 7": 3200,
  "Class 8": 3500,
  "Class 9": 4000,
  "Class 10": 4000,
  "Class 11": 5000,
  "Class 12": 5000,
};

export const STUDENTS = Array.from({ length: 120 }, (_, i) => ({
  id: `STU${String(i + 1).padStart(4, "0")}`,
  name: [
    "Aarav Sharma",
    "Priya Singh",
    "Rahul Gupta",
    "Sneha Patel",
    "Arjun Verma",
    "Kavya Nair",
    "Vikram Joshi",
    "Ananya Reddy",
    "Rohan Mehta",
    "Isha Agarwal",
    "Dev Kumar",
    "Meera Iyer",
    "Siddharth Rao",
    "Pooja Saxena",
    "Aditya Tiwari",
    "Riya Bose",
    "Karan Malhotra",
    "Simran Kaur",
    "Nikhil Pandey",
    "Tanvi Shah",
  ][i % 20],
  rollNo: i + 1,
  class: CLASSES[Math.floor(i / 10)],
  section: ["A", "B", "C"][i % 3],
  gender: i % 2 === 0 ? "Male" : "Female",
  dob: `${2000 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(
    2,
    "0"
  )}-${String((i % 28) + 1).padStart(2, "0")}`,
  phone: `98${String(7000000000 + i * 1000000).slice(0, 8)}`,
  parent: `Parent of Student ${i + 1}`,
  address: `${i + 1}, Block ${["A", "B", "C", "D"][i % 4]}, Knowledge Park`,
  feeStatus: ["Paid", "Pending", "Partial"][i % 3],
  admissionDate: `2020-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(
    2,
    "0"
  )}`,
  photo: ["👦", "👧"][i % 2],
}));

export const TEACHERS = Array.from({ length: 25 }, (_, i) => ({
  id: `TCH${String(i + 1).padStart(3, "0")}`,
  name: [
    "Mr. Rajesh Kumar",
    "Mrs. Sunita Sharma",
    "Mr. Pradeep Singh",
    "Mrs. Kavita Gupta",
    "Mr. Amit Verma",
    "Mrs. Rekha Patel",
    "Mr. Suresh Nair",
    "Mrs. Geeta Joshi",
    "Mr. Manish Agarwal",
    "Mrs. Anita Rao",
    "Mr. Deepak Mehta",
    "Mrs. Priti Iyer",
    "Mr. Sanjay Tiwari",
    "Mrs. Nisha Bose",
    "Mr. Vikas Malhotra",
    "Mrs. Pooja Kaur",
    "Mr. Ajay Pandey",
    "Mrs. Smita Shah",
    "Mr. Ramesh Verma",
    "Mrs. Sunita Singh",
    "Mr. Prakash Kumar",
    "Mrs. Lakshmi Nair",
    "Mr. Mohan Gupta",
    "Mrs. Geeta Sharma",
    "Mr. Arun Patel",
  ][i],
  subject: [
    "Mathematics",
    "English",
    "Science",
    "Hindi",
    "Social Studies",
    "Computer",
    "Physics",
    "Chemistry",
    "Biology",
    "Sanskrit",
    "Drawing",
    "Physical Ed",
    "Geography",
    "History",
    "Civics",
    "Economics",
    "Accountancy",
    "Business Studies",
    "EVS",
    "Music",
    "Art",
    "Home Science",
    "Psychology",
    "Political Science",
    "Sociology",
  ][i % 25],
  phone: `97${String(8000000000 + i * 1000000).slice(0, 8)}`,
  email: `teacher${i + 1}@sunriseschool.edu`,
  assignedClasses: [CLASSES[i % 12], CLASSES[(i + 2) % 12]],
  experience: `${(i % 15) + 2} years`,
  qualification: [
    "B.Ed, M.Sc",
    "B.Ed, M.A",
    "B.Ed, B.Sc",
    "M.Ed, M.A",
    "B.Ed, M.Com",
  ][i % 5],
  joinDate: `20${String(10 + (i % 13)).padStart(2, "0")}-06-01`,
  status: i === 3 || i === 7 ? "Absent" : "Present",
  photo: ["👨‍🏫", "👩‍🏫"][i % 2],
}));

export const generateMarks = () => {
  const data = {};
  STUDENTS.forEach((s) => {
    data[s.id] = {};
    const subjects = CLASS_SUBJECTS[s.class] || ["English", "Maths", "Science"];
    subjects.forEach((sub) => {
      data[s.id][sub] = {
        ut1: Math.floor(Math.random() * 15) + 5,
        ut2: Math.floor(Math.random() * 15) + 5,
        half: Math.floor(Math.random() * 50) + 25,
        annual: Math.floor(Math.random() * 80) + 40,
      };
    });
  });
  return data;
};

export const MARKS_DATA = generateMarks();

export const FEES_DATA = STUDENTS.map((s) => ({
  studentId: s.id,
  studentName: s.name,
  class: s.class,
  section: s.section,
  monthlyFee: FEE_STRUCTURE[s.class] || 3000,
  paid:
    s.feeStatus === "Paid"
      ? FEE_STRUCTURE[s.class] * 11
      : s.feeStatus === "Partial"
      ? FEE_STRUCTURE[s.class] * 6
      : 0,
  pending:
    s.feeStatus === "Pending"
      ? FEE_STRUCTURE[s.class] * 11
      : s.feeStatus === "Partial"
      ? FEE_STRUCTURE[s.class] * 5
      : 0,
  lastPaid: s.feeStatus !== "Pending" ? `2024-11-01` : "Never",
  history: Array.from({ length: 6 }, (_, i) => ({
    month: ["June", "July", "August", "September", "October", "November"][i],
    amount: FEE_STRUCTURE[s.class] || 3000,
    status: [
      "Paid",
      "Paid",
      "Paid",
      "Paid",
      s.feeStatus === "Pending" ? "Pending" : "Paid",
      "Pending",
    ][i],
  })),
}));
