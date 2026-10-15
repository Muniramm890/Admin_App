// FILE: teacher-app/src/components/layout/navItems.ts
// Source: admin App.tsx -> NAV_ITEMS [1794-1844]
// @ts-nocheck

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
export const NAV_ITEMS = [
  {
    group: "MAIN",
    items: [{ id: "dashboard", label: "Dashboard", icon: "dashboard" }],
  },
  {
    group: "ACADEMIC SETUP",
    items: [
      { id: "setup", label: "School Setup", icon: "setup" },
      { id: "students", label: "Students", icon: "students" },
      { id: "teachers", label: "Teachers", icon: "teachers" },
      { id: "promotion", label: "Promotion & TC", icon: "arrow_right" },
      { id: "TransportModule", label:"Transport",icon: "bus"},
      { id: "commhub", label: "Communication Hub", icon: "bell" },
    ],
  },
  {
    group: "DAILY OPS",
    items: [
      { id: "attendance", label: "Attendance", icon: "attendance" },
      { id: "arrangement", label: "Substitution", icon: "refresh" },
      { id: "timetable", label: "Timetable", icon: "timetable" },
      { id: "tests", label: "Quick Tests", icon: "test" },
      { id: "homework", label: "Homework", icon: "homework" },
    ],
  },
  {
    group: "FINANCE & RESULTS",
    items: [
      { id: "fees", label: "Fee Management", icon: "fee" },
      { id: "payroll", label: "Payroll", icon: "wallet" },
      { id: "exams", label: "Exam Management", icon: "test" },
      { id: "results", label: "Results", icon: "result" },
    ],
  },
  {
    group: "ANALYTICS",
    items: [
      { id: "leaderboard", label: "Leaderboard", icon: "trophy" },
      { id: "analytics", label: "Academic Analytics", icon: "academic" },
    ],
  },
  {
    group: "ADMINISTRATION",
    superAdminOnly: true,
    items: [
      { id: "usermanagement", label: "User Management", icon: "user" },
      { id: "auditlogs", label: "Audit Logs", icon: "attendance" },
    ],
  },
];
