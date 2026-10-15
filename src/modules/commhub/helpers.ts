// FILE: teacher-app/src/modules/commhub/helpers.ts
// Source: admin App.tsx -> TARGET_TYPE_META [10070-10079], ATTACHMENT_CHANNEL_MATRIX [10082-10088], detectAttachmentType [10089-10094]
// @ts-nocheck

// =========================================================
// COMMUNICATION HUB -- targeted notices across App / Email, with attachments
// (No WhatsApp -- Meta blocks freeform business-initiated messages outside approved templates)
// =========================================================
export const TARGET_TYPE_META = {
  all_school: { label: "Whole School" },
  grade: { label: "Entire Class/Grade" },
  section: { label: "Specific Section" },
  gender_in_section: { label: "Boys/Girls in a Section" },
  student: { label: "Individual Student" },
  subject_teachers: { label: "Teachers of a Subject" },
  class_teachers: { label: "Class Teacher(s)" },
  role: { label: "Staff by Role" },
};

// Mirrors backend ATTACHMENT_CHANNEL_MATRIX -- keep both in sync if it ever changes
export const ATTACHMENT_CHANNEL_MATRIX = {
  none: ["app", "email", "sms"],
  image: ["app", "email"],
  pdf: ["app", "email"],
  document: ["app", "email"],
  video: ["app"],
};

export const detectAttachmentType = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "document";
};
