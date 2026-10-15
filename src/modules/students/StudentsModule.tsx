// FILE: teacher-app/src/modules/students/StudentsModule.tsx
// Source: admin App.tsx -> StudentsModule [2975-5133]
// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../api/client";
import { uploadToCloudinary } from "../../api/uploads";
import { Field } from "../../components/ui/Field";
import { FormGrid } from "../../components/ui/FormGrid";
import { FormRow } from "../../components/ui/FormRow";
import { Icon } from "../../components/ui/Icon";
import { LogoLoader } from "../../components/ui/LogoLoader";
import { Modal } from "../../components/ui/Modal";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { useSession } from "../../contexts/SessionContext";
import { IssueTCModal } from "./IssueTCModal";
import { StudentCard } from "./StudentCard";
import { C } from "../../theme/theme";

export const StudentsModule = () => {
  // ── State ──────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [stats, setStats] = useState({ active: 0, male: 0, female: 0 });
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const { academicYears: academicYrs, currentYear } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
  // 🔴 Student Photo Upload Handler
  const [uploadingStudentPhoto, setUploadingStudentPhoto] = useState(false);

  const handleStudentPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStudentPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      setF("photo_url", url);
    } catch (err) {
      alert("Photo upload failed. Please try again.");
    } finally {
      setUploadingStudentPhoto(false);
    }
  };
  // Filters
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSec, setFilterSec] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Modals
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'view' | 'delete' | 'bulk'
  const [tcStudent, setTcStudent] = useState(null); // 🔴 Issue TC modal target
  const [activeTab, setActiveTab] = useState("personal");
  const [selected, setSelected] = useState(null);

  // Bulk import
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const fileRef = useRef(null);

  // ── Blank Form ─────────────────────────────────────────────
  const blankForm = () => ({
    admission_no: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "Male",
    date_of_birth: "",
    blood_group: "",
    nationality: "Indian",
    religion: "",
    caste: "",
    sub_caste: "",
    is_ews: false,
    aadhaar_no: "",
    previous_school: "",
    tc_no: "",
    admission_date: new Date().toISOString().split("T")[0],
    address_permanent: "",
    address_current: "",
    city: "",
    state: "",
    pincode: "",
    photo_url: "",
    medical_conditions: "",
    disabilities: "",
    extra_curricular: "",
    is_active: true,
    grade_id: "",
    section_id: "",
    academic_year_id: "",
    roll_no: "",
    g_relation: "Father",
    g_full_name: "",
    g_phone: "",
    g_email: "",
    g2_relation: "Mother",
    g2_full_name: "",
    g2_phone: "",
    g2_email: "",
  });

  const [form, setForm] = useState(blankForm());
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [search, filterGrade, filterSec, filterGender, filterStatus]);

  useEffect(() => {
    loadAll();
  }, [page, search, filterGrade, filterSec, filterGender, filterStatus]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
        search: search || "",
        grade_id: filterGrade || "",
        section_id: filterSec || "",
        gender: filterGender || "",
        sort: "roll_no",
        order: "asc",
        is_active:
          filterStatus === "active"
            ? "true"
            : filterStatus === "inactive"
            ? "false"
            : "",
      });

      const [gRes, secRes, stuRes] = await Promise.all([
        apiRequest("/setup/grades"),
        apiRequest("/setup/sections"),
        apiRequest(`/students?include=guardian,enrolment&${params.toString()}`),
      ]);

      setGrades(gRes?.data || []);
      setSections(secRes?.data || []);
      setStudents(Array.isArray(stuRes?.data) ? stuRes.data : []);
      setTotalStudents(stuRes?.total || 0);
      if (stuRes?.stats) {
        setStats(stuRes.stats);
      } else {
        const d = stuRes?.data || [];
        setStats({
          active: d.filter((s) => s.is_active).length,
          male: d.filter((s) => s.gender === "Male").length,
          female: d.filter((s) => s.gender === "Female").length,
        });
      }
    } catch (e) {
      console.error("Load failed", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  const filteredSections = (gid) => sections.filter((s) => s.grade_id === gid);
  const gradeName = (gid) => grades.find((g) => g.id === gid)?.name || "—";
  const secName = (sid) => sections.find((s) => s.id === sid)?.name || "—";
  const totalPages = Math.ceil(totalStudents / PAGE_SIZE) || 0;
  const pageData = students;

  // ── Open modals ────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...blankForm(), academic_year_id: currentYear?.id || "" });
    setActiveTab("personal");
    setModal("add");
  };

  const openEdit = (s) => {
    setForm({
      ...blankForm(),
      ...s,
      admission_date: s.admission_date ? s.admission_date.split("T")[0] : "",
      date_of_birth: s.date_of_birth ? s.date_of_birth.split("T")[0] : "",
      photo_url: s.photo_url || "",
      grade_id: s.enrolment?.grade_id || "",
      section_id: s.enrolment?.section_id || "",
      academic_year_id: s.enrolment?.academic_year_id || currentYear?.id || "",
      roll_no: s.enrolment?.roll_no || "",
      g_relation: s.guardians?.[0]?.relation || "Father",
      g_full_name: s.guardians?.[0]?.full_name || "",
      g_phone: s.guardians?.[0]?.phone || "",
      g_email: s.guardians?.[0]?.email || "",
      g2_relation: s.guardians?.[1]?.relation || "Mother",
      g2_full_name: s.guardians?.[1]?.full_name || "",
      g2_phone: s.guardians?.[1]?.phone || "",
      g2_email: s.guardians?.[1]?.email || "",
    });
    setSelected(s);
    setActiveTab("personal");
    setModal("edit");
  };

  const openView = (s) => {
    setSelected(s);
    setModal("view");
  };
  const openDel = (s) => {
    setSelected(s);
    setModal("delete");
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.first_name || !form.date_of_birth || !form.gender) {
      alert("First name, DOB and Gender are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        admission_no: form.admission_no,
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        blood_group: form.blood_group,
        nationality: form.nationality,
        religion: form.religion,
        caste: form.caste,
        sub_caste: form.sub_caste,
        is_ews: form.is_ews,
        aadhaar_no: form.aadhaar_no,
        previous_school: form.previous_school,
        tc_no: form.tc_no,
        admission_date: form.admission_date,
        address_permanent: form.address_permanent,
        address_current: form.address_current,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        photo_url: form.photo_url,
        medical_conditions: form.medical_conditions,
        disabilities: form.disabilities,
        extra_curricular: form.extra_curricular,
        is_active: form.is_active,
        enrolment: form.grade_id
          ? {
              grade_id: form.grade_id,
              section_id: form.section_id,
              academic_year_id: form.academic_year_id,
              roll_no: form.roll_no,
            }
          : null,
        guardians: [
          form.g_full_name
            ? {
                relation: form.g_relation,
                full_name: form.g_full_name,
                phone: form.g_phone,
                email: form.g_email,
                is_primary: true,
              }
            : null,
          form.g2_full_name
            ? {
                relation: form.g2_relation,
                full_name: form.g2_full_name,
                phone: form.g2_phone,
                email: form.g2_email,
                is_primary: false,
              }
            : null,
        ].filter(Boolean),
      };

      if (modal === "edit" && selected?.id) {
        await apiRequest(`/students/${selected.id}`, "PUT", payload);
      } else {
        await apiRequest("/students", "POST", payload);
      }
      setModal(null);
      await loadAll();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiRequest(`/students/${selected.id}`, "DELETE");
      setModal(null);
      await loadAll();
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Bulk CSV Import (unchanged logic) ───────────────────────
  const CSV_COLS = [
    "admission_no",
    "student_full_name",
    "gender",
    "date_of_birth",
    "class_name",
    "section_name",
    "roll_no",
    "guardian_name",
    "guardian_phone",
    "guardian_relation",
    "guardian_email",
    "address_city",
    "address_pincode",
  ];

  const parseCsv = (text) => {
    const lines = text.trim().split("\n");
    if (!lines.length) return [];
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines
      .slice(1)
      .map((line, i) => {
        const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const row = {};
        CSV_COLS.forEach((col, ci) => {
          const hi = header.indexOf(col);
          row[col] = hi >= 0 ? vals[hi] : vals[ci] || "";
        });
        row._line = i + 2;

        const nameParts = (row.student_full_name || "").trim().split(/\s+/);
        row._first_name = nameParts[0] || "";
        row._last_name =
          nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
        row._middle_name =
          nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

        const g = grades.find(
          (gr) => gr.name.toLowerCase() === (row.class_name || "").toLowerCase()
        );
        row._grade_id = g?.id || null;
        const sec = sections.find(
          (s) =>
            s.grade_id === row._grade_id &&
            s.name.toLowerCase() === (row.section_name || "").toLowerCase()
        );
        row._section_id = sec?.id || null;

        row._errors = [];
        if (!row._first_name) row._errors.push("Student name required");
        if (!row.date_of_birth) row._errors.push("DOB required");
        if (!row.gender) row._errors.push("Gender required");
        if (!row.guardian_name) row._errors.push("Guardian name required");
        if (!row.guardian_phone) row._errors.push("Guardian phone required");
        if (row.class_name && !row._grade_id)
          row._errors.push(`Class "${row.class_name}" not found`);
        if (row.section_name && row._grade_id && !row._section_id)
          row._errors.push(`Section "${row.section_name}" not in class`);
        return row;
      })
      .filter((r) => r._first_name || r.admission_no);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCsv(ev.target.result);
      setBulkRows(rows);
      setBulkErrors(rows.filter((r) => r._errors.length > 0));
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    const valid = bulkRows.filter((r) => r._errors.length === 0);
    if (!valid.length) {
      alert("No valid rows to import.");
      return;
    }
    setBulkLoading(true);
    let success = 0,
      fail = 0;
    let failedRows = [];
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        await apiRequest("/students", "POST", {
          admission_no:
            row.admission_no ||
            `ADM-${Date.now().toString().slice(-5)}${Math.floor(
              Math.random() * 100
            )}-${success}`,
          first_name: row._first_name || "Unknown",
          middle_name: row._middle_name || "",
          last_name: row._last_name || "",
          gender: row.gender || "Male",
          date_of_birth: row.date_of_birth,
          admission_date: new Date().toISOString().split("T")[0],
          city: row.address_city || "",
          pincode: row.address_pincode || "",
          is_active: true,
          enrolment: row._grade_id
            ? {
                grade_id: row._grade_id,
                section_id: row._section_id,
                academic_year_id: currentYear?.id,
                roll_no: row.roll_no || "",
              }
            : null,
          guardians: [
            {
              relation: row.guardian_relation || "Parent",
              full_name: row.guardian_name || "Unknown Guardian",
              phone: row.guardian_phone || "",
              email: row.guardian_email || "",
              is_primary: true,
            },
          ],
        });
        success++;
      } catch (err) {
        fail++;
        const backendError =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err.message ||
          "Database execution failed";
        row.Backend_Error = backendError;
        row._errors = [`Backend Error: ${backendError}`];
        failedRows.push(row);
      }
      if ((i + 1) % 10 === 0) await sleep(1000);
    }

    setBulkLoading(false);
    await loadAll();

    if (fail > 0) {
      setBulkRows(failedRows);
      setBulkErrors(failedRows);
      alert(
        `⚠️ ${success} Imported, ${fail} Failed.\nDownloading Failed Students CSV...`
      );
      downloadFailedCSV(failedRows);
    } else {
      alert(`🎉 All ${success} Students Imported Successfully!`);
      setModal(null);
      setBulkRows([]);
    }
  };

  const downloadFailedCSV = (failedRows) => {
    if (!failedRows || failedRows.length === 0) return;
    const sampleRow = failedRows[0];
    const headers = Object.keys(sampleRow).filter((k) => !k.startsWith("_"));
    if (!headers.includes("Backend_Error")) headers.push("Backend_Error");
    let csvContent = headers.join(",") + "\n";
    failedRows.forEach((row) => {
      const rowData = headers.map((header) => {
        let val = row[header] == null ? "" : String(row[header]);
        val = val.replace(/"/g, '""');
        if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`;
        return val;
      });
      csvContent += rowData.join(",") + "\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Failed_Students_Import_${new Date().getTime()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSample = () => {
    const sample = [
      CSV_COLS.join(","),
      `ADM001,Rahul Kumar Sharma,Male,2012-06-15,${
        grades[0]?.name || "Class 7"
      },${
        filteredSections(grades[0]?.id)[0]?.name || "A"
      },101,Suresh Sharma,9876543210,Father,suresh@email.com,Jaipur,302001`,
      `ADM002,Priya Gupta,Female,2011-03-20,${grades[0]?.name || "Class 7"},${
        filteredSections(grades[0]?.id)[0]?.name || "A"
      },102,Meena Gupta,9812345678,Mother,,Delhi,110001`,
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(sample);
    a.download = "school_bulk_students_template.csv";
    a.click();
  };

  const totalActive = students.filter((s) => s.is_active).length;
  const totalMale = students.filter((s) => s.gender === "BOY").length;
  const totalFemale = students.filter((s) => s.gender === "GIRL").length;

  // ── UI helpers ─────────────────────────────────────────────
  // 🔴 FIX: TabBtn is a plain function now — call it as TabBtn({...}),
  // never as <TabBtn .../>. This prevents remounting the tab bar (and
  // any input inside the active tab) on every keystroke.
  const TabBtn = ({ id, label, icon }) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 12.5,
        fontWeight: 600,
        background: activeTab === id ? `${C.primary}22` : "transparent",
        color: activeTab === id ? C.primary : C.textMuted,
        borderBottom:
          activeTab === id ? `2px solid ${C.primary}` : "2px solid transparent",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <Icon name={icon} size={13} />
      {label}
    </button>
  );

  // 🔴 FIX: FormBody is a plain function now — call it as {FormBody()},
  // never as <FormBody />. It still closes over `form`, `setF`,
  // `activeTab`, `grades`, `sections` etc. from StudentsModule's scope,
  // so no props need to be threaded through. This is what stops the
  // cursor from jumping out after one character.
  const FormBody = () => (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 18,
          borderBottom: `1px solid ${C.border}44`,
          flexWrap: "wrap",
        }}
      >
        {TabBtn({ id: "personal", label: "Personal", icon: "user" })}
        {TabBtn({ id: "academic", label: "Academic", icon: "academic" })}
        {TabBtn({ id: "guardian", label: "Guardian", icon: "teachers" })}
        {TabBtn({ id: "address", label: "Address", icon: "dashboard" })}
        {TabBtn({ id: "medical", label: "Medical", icon: "warning" })}
      </div>

      {activeTab === "personal" && (
        <div>
          <FormGrid cols={3}>
            <Field
              form={form}
              setF={setF}
              label="First Name *"
              name="first_name"
            />
            <Field
              form={form}
              setF={setF}
              label="Middle Name"
              name="middle_name"
            />
            <Field form={form} setF={setF} label="Last Name" name="last_name" />
          </FormGrid>
          <FormGrid cols={3}>
            <Field
              form={form}
              setF={setF}
              label="Gender *"
              name="gender"
              options={["BOY", "GIRL", "Other"]}
            />
            <Field
              form={form}
              setF={setF}
              label="Date of Birth *"
              name="date_of_birth"
              type="date"
            />
            <Field
              form={form}
              setF={setF}
              label="Blood Group"
              name="blood_group"
              options={["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
            />
          </FormGrid>
          <FormGrid cols={3}>
            <Field
              form={form}
              setF={setF}
              label="Nationality"
              name="nationality"
            />
            <Field form={form} setF={setF} label="Religion" name="religion" />
            <Field form={form} setF={setF} label="Caste" name="caste" />
          </FormGrid>
          <FormGrid cols={3}>
            <Field form={form} setF={setF} label="Sub-Caste" name="sub_caste" />
            <Field
              form={form}
              setF={setF}
              label="Aadhaar No."
              name="aadhaar_no"
            />
            <Field
              form={form}
              setF={setF}
              label="EWS Student"
              name="is_ews"
              type="checkbox"
            />
          </FormGrid>
          {/* 🔴 Direct Student Photo Upload UI */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase" }}>
              Student Photo
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 16, background: C.surfaceAlt, padding: 14, borderRadius: 12, border: `1px solid ${C.border}` }}>
              {form.photo_url ? (
                <img src={form.photo_url} alt="Student" style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.primary}` }} />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: `${C.primary}22`, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>
                  {(form.first_name?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div>
                <input 
                  type="file" 
                  id="student-photo-input" 
                  accept="image/*" 
                  style={{ display: "none" }} 
                  onChange={handleStudentPhotoUpload} 
                  disabled={uploadingStudentPhoto}
                />
                <label 
                  htmlFor="student-photo-input" 
                  className="btn btn-primary" 
                  style={{ cursor: uploadingStudentPhoto ? "wait" : "pointer", padding: "6px 14px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  {uploadingStudentPhoto ? "Uploading..." : "📷 Select Photo"}
                </label>
                <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>Square JPG/PNG image</div>
              </div>
            </div>
          </div>
          <FormGrid cols={2}>
            <Field
              form={form}
              setF={setF}
              label="Extra-curricular Activities"
              name="extra_curricular"
            />
            <Field
              form={form}
              setF={setF}
              label="Is Active"
              name="is_active"
              type="checkbox"
            />
          </FormGrid>
        </div>
      )}

      {activeTab === "academic" && (
        <div>
          <FormGrid cols={2}>
            <Field
              form={form}
              setF={setF}
              label="Admission No. *"
              name="admission_no"
            />
            <Field
              form={form}
              setF={setF}
              label="Admission Date *"
              name="admission_date"
              type="date"
            />
          </FormGrid>
          <FormGrid cols={2}>
            <Field
              form={form}
              setF={setF}
              label="Previous School"
              name="previous_school"
            />
            <Field form={form} setF={setF} label="TC No." name="tc_no" />
          </FormGrid>
          <div
            style={{
              padding: "14px 16px",
              background: `${C.primary}11`,
              borderRadius: 12,
              border: `1px solid ${C.primary}22`,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.primary,
                textTransform: "uppercase",
                marginBottom: 10,
                letterSpacing: "0.5px",
              }}
            >
              Class Enrolment
            </div>
            <FormGrid cols={2}>
              <FormRow label="Class / Grade">
                <select
                  className="select"
                  value={form.grade_id || ""}
                  onChange={(e) => {
                    setF("grade_id", e.target.value);
                    setF("section_id", "");
                  }}
                >
                  <option value="">-- Select Class --</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Section">
                <select
                  className="select"
                  value={form.section_id || ""}
                  onChange={(e) => setF("section_id", e.target.value)}
                  disabled={!form.grade_id}
                >
                  <option value="">-- Select Section --</option>
                  {filteredSections(form.grade_id).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormRow>
            </FormGrid>
            <FormGrid cols={2}>
              <FormRow label="Academic Year">
                <select
                  className="select"
                  value={form.academic_year_id || ""}
                  onChange={(e) => setF("academic_year_id", e.target.value)}
                >
                  <option value="">-- Select Year --</option>
                  {academicYrs.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name}
                      {ay.is_current ? " (Current)" : ""}
                    </option>
                  ))}
                </select>
              </FormRow>
              <Field form={form} setF={setF} label="Roll No." name="roll_no" />
            </FormGrid>
          </div>
        </div>
      )}

      {activeTab === "guardian" && (
        <div>
          <div
            style={{
              padding: "14px 16px",
              background: `${C.green}11`,
              borderRadius: 12,
              border: `1px solid ${C.green}22`,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                textTransform: "uppercase",
                marginBottom: 10,
                letterSpacing: "0.5px",
              }}
            >
              Primary Guardian
            </div>
            <FormGrid cols={2}>
              <Field
                form={form}
                setF={setF}
                label="Relation"
                name="g_relation"
                options={[
                  "Father",
                  "Mother",
                  "Guardian",
                  "Uncle",
                  "Aunt",
                  "Grandparent",
                  "Other",
                ]}
              />
              <Field
                form={form}
                setF={setF}
                label="Full Name *"
                name="g_full_name"
              />
            </FormGrid>
            <FormGrid cols={2}>
              <Field
                form={form}
                setF={setF}
                label="Phone *"
                name="g_phone"
                type="tel"
              />
              <Field
                form={form}
                setF={setF}
                label="Email"
                name="g_email"
                type="email"
              />
            </FormGrid>
          </div>
          <div
            style={{
              padding: "14px 16px",
              background: `${C.blue}11`,
              borderRadius: 12,
              border: `1px solid ${C.blue}22`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.blue,
                textTransform: "uppercase",
                marginBottom: 10,
                letterSpacing: "0.5px",
              }}
            >
              Secondary Guardian (Optional)
            </div>
            <FormGrid cols={2}>
              <Field
                form={form}
                setF={setF}
                label="Relation"
                name="g2_relation"
                options={[
                  "Father",
                  "Mother",
                  "Guardian",
                  "Uncle",
                  "Aunt",
                  "Grandparent",
                  "Other",
                ]}
              />
              <Field
                form={form}
                setF={setF}
                label="Full Name"
                name="g2_full_name"
              />
            </FormGrid>
            <FormGrid cols={2}>
              <Field
                form={form}
                setF={setF}
                label="Phone"
                name="g2_phone"
                type="tel"
              />
              <Field
                form={form}
                setF={setF}
                label="Email"
                name="g2_email"
                type="email"
              />
            </FormGrid>
          </div>
        </div>
      )}

      {activeTab === "address" && (
        <div>
          <FormRow label="Permanent Address">
            <textarea
              className="input"
              rows={3}
              value={form.address_permanent || ""}
              onChange={(e) => setF("address_permanent", e.target.value)}
              style={{ resize: "vertical", minHeight: 70 }}
            />
          </FormRow>
          <FormRow label="Current Address (if different)">
            <textarea
              className="input"
              rows={3}
              value={form.address_current || ""}
              onChange={(e) => setF("address_current", e.target.value)}
              style={{ resize: "vertical", minHeight: 70 }}
            />
          </FormRow>
          <FormGrid cols={3}>
            <Field form={form} setF={setF} label="City" name="city" />
            <Field form={form} setF={setF} label="State" name="state" />
            <Field form={form} setF={setF} label="Pincode" name="pincode" />
          </FormGrid>
        </div>
      )}

      {activeTab === "medical" && (
        <div>
          <FormRow label="Medical Conditions (if any)">
            <textarea
              className="input"
              rows={3}
              value={form.medical_conditions || ""}
              onChange={(e) => setF("medical_conditions", e.target.value)}
              style={{ resize: "vertical", minHeight: 80 }}
            />
          </FormRow>
          <FormRow label="Disabilities (if any)">
            <textarea
              className="input"
              rows={3}
              value={form.disabilities || ""}
              onChange={(e) => setF("disabilities", e.target.value)}
              style={{ resize: "vertical", minHeight: 80 }}
            />
          </FormRow>
          <div
            style={{
              padding: 12,
              background: `${C.yellow}11`,
              border: `1px solid ${C.yellow}33`,
              borderRadius: 10,
              marginTop: 8,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: C.yellow,
                margin: 0,
                fontWeight: 600,
              }}
            >
              ℹ This information is confidential and used only for emergency
              medical response.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // ── MAIN RENDER ────────────────────────────────────────────
  return (
    <div className="slide-in">
      <SectionHeader
        title="Student Management"
        sub={`${students.length} students enrolled`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setBulkRows([]);
                setBulkErrors([]);
                setModal("bulk");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
              }}
            >
              <Icon name="download" size={14} /> Bulk Import
            </button>
            <button
              className="btn btn-primary"
              onClick={openAdd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
              }}
            >
              <Icon name="plus" size={14} /> New Admission
            </button>
          </div>
        }
      />

      {/* Stats Row */}
      <div
        className="grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          {
            label: "Total Enrolled",
            value: totalStudents,
            color: C.blue,
            icon: "students",
          },
          {
            label: "Active",
            value: totalActive,
            color: C.green,
            icon: "check",
          },
          { label: "Boys", value: totalMale, color: C.cyan, icon: "user" },
          { label: "Girls", value: totalFemale, color: C.purple, icon: "user" },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ padding: "14px 16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    marginBottom: 4,
                  }}
                >
                  {k.label}
                </div>
                <div
                  className="syne"
                  style={{ fontSize: 26, fontWeight: 800, color: C.text }}
                >
                  {loading ? "—" : k.value}
                </div>
              </div>
              <div
                style={{
                  background: `${k.color}22`,
                  padding: 10,
                  borderRadius: 10,
                  color: k.color,
                }}
              >
                <Icon name={k.icon} size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 14, padding: "12px 16px" }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <div
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <Icon name="search" size={14} color={C.textMuted} />
            </div>
            <input
              className="input"
              placeholder="Search name or admission no…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: 32 }}
            />
          </div>
          <select
            className="select"
            style={{ width: 140 }}
            value={filterGrade}
            onChange={(e) => {
              setFilterGrade(e.target.value);
              setFilterSec("");
              setPage(1);
            }}
          >
            <option value="">All Classes</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 120 }}
            value={filterSec}
            onChange={(e) => {
              setFilterSec(e.target.value);
              setPage(1);
            }}
            disabled={!filterGrade}
          >
            <option value="">All Sections</option>
            {filteredSections(filterGrade).map((s) => (
              <option key={s.id} value={s.id}>
                Sec {s.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 110 }}
            value={filterGender}
            onChange={(e) => {
              setFilterGender(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Gender</option>
            <option value="Male">BOY</option>
            <option value="Female">GIRL</option>
          </select>
          <select
            className="select"
            style={{ width: 120 }}
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(search || filterGrade || filterGender || filterStatus) && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "7px 12px" }}
              onClick={() => {
                setSearch("");
                setFilterGrade("");
                setFilterSec("");
                setFilterGender("");
                setFilterStatus("");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}

          {/* Grid / Table toggle — same pattern as TeachersModule */}
          <div
            style={{
              display: "flex",
              background: C.surfaceAlt,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            {[
              ["grid", "chart"],
              ["table", "result"],
            ].map(([m, icon]) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  padding: "7px 11px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  background: viewMode === m ? `${C.primary}22` : "transparent",
                  color: viewMode === m ? C.primary : C.textMuted,
                }}
                title={m === "grid" ? "Grid view" : "Table view"}
              >
                <Icon name={icon} size={14} />
              </button>
            ))}
          </div>

          <div
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: C.textMuted,
              fontWeight: 600,
            }}
          >
            {totalStudents} result{totalStudents !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
                <div className="card" style={{ padding: 30 }}>
                <LogoLoader size={44} label="Syncing student records…" />
              </div>
      ) : pageData.length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎓</div>
          <div
            className="syne"
            style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}
          >
            No students found
          </div>
          <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 20 }}>
            {students.length === 0
              ? "Start by adding new admissions or importing via CSV."
              : "Try adjusting filters."}
          </div>
          {students.length === 0 && (
            <button className="btn btn-primary" onClick={openAdd}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="plus" size={14} /> Add First Student
              </span>
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {pageData.map((s) =>
            StudentCard({
              s,
              gradeName,
              secName,
              onView: openView,
              onEdit: openEdit,
              onDelete: openDel,
              onIssueTC: setTcStudent,
            })
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Student</th>
                  <th>Adm. No.</th>
                  <th>Class</th>
                  <th>DOB</th>
                  <th>Guardian</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((s, idx) => {
                  const enr = s.enrolment;
                  const primary = s.guardians?.[0];
                  const gname = enr
                    ? `${gradeName(enr.grade_id)} ${secName(enr.section_id)}`
                    : "—";
                  const fullName = [s.first_name, s.middle_name, s.last_name]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr key={s.id}>
                      <td style={{ color: C.textMuted, fontSize: 11 }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background:
                                s.gender === "GIRL"
                                  ? `${C.purple}33`
                                  : `${C.blue}33`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: s.gender === "GIRL" ? C.purple : C.blue,
                            }}
                          >
                            {(s.first_name?.[0] || "?").toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {fullName}
                            </div>
                            {enr?.roll_no && (
                              <div
                                style={{ fontSize: 10.5, color: C.textMuted }}
                              >
                                Roll #{enr.roll_no}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: C.textMuted,
                        }}
                      >
                        {s.admission_no || "—"}
                      </td>
                      <td>
                        {enr ? (
                          <span className="badge badge-blue">{gname}</span>
                        ) : (
                          <span style={{ color: C.red, fontSize: 12 }}>
                            Not enrolled
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: C.textMuted }}>
                        {s.date_of_birth
                          ? new Date(s.date_of_birth).toLocaleDateString(
                              "en-IN"
                            )
                          : "—"}
                      </td>
                      <td>
                        {primary ? (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>
                              {primary.full_name}
                            </div>
                            <div style={{ fontSize: 11, color: C.textMuted }}>
                              {primary.phone}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: C.textMuted, fontSize: 12 }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.is_active ? "badge-green" : "badge-red"
                          }`}
                        >
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            justifyContent: "center",
                          }}
                        >
                          <button
                            className="btn btn-ghost"
                            title="View"
                            style={{ padding: "5px 8px" }}
                            onClick={() => openView(s)}
                          >
                            <Icon name="eye" size={13} />
                          </button>
                          <button
                            className="btn btn-ghost"
                            title="Edit"
                            style={{ padding: "5px 8px" }}
                            onClick={() => openEdit(s)}
                          >
                            <Icon name="edit" size={13} />
                          </button>
                          {s.is_active && (
                            <button
                              className="btn btn-ghost"
                              title="Issue TC / Mark as Left"
                              style={{ padding: "5px 8px", color: C.red }}
                              onClick={() => setTcStudent(s)}
                            >
                              <Icon name="file" size={13} />
                            </button>
                          )}
                          <button
                            className="btn btn-danger"
                            title="Delete"
                            style={{ padding: "5px 8px" }}
                            onClick={() => openDel(s)}
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 16px",
                borderTop: `1px solid ${C.border}33`,
              }}
            >
              <div style={{ fontSize: 12, color: C.textMuted }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, totalStudents)} of {totalStudents}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "5px 12px", fontSize: 12 }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = page <= 3 ? i + 1 : page + i - 2;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button
                      key={pg}
                      className="btn btn-ghost"
                      style={{
                        padding: "5px 10px",
                        fontSize: 12,
                        background:
                          pg === page ? `${C.primary}22` : "transparent",
                        color: pg === page ? C.primary : C.textMuted,
                      }}
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  className="btn btn-ghost"
                  style={{ padding: "5px 12px", fontSize: 12 }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid view pagination (simple, since grid uses same pageData) */}
      {viewMode === "grid" && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: 16,
          }}
        >
          <button
            className="btn btn-ghost"
            style={{ padding: "5px 12px", fontSize: 12 }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span
            style={{ alignSelf: "center", fontSize: 12, color: C.textMuted }}
          >
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            style={{ padding: "5px 12px", fontSize: 12 }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* ════════ MODAL: ADD / EDIT ════════ */}
      <Modal
        open={modal === "add" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit Student Profile" : "New Admission"}
        width={700}
      >
        {FormBody()}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
            borderTop: `1px solid ${C.border}33`,
            paddingTop: 16,
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => setModal(null)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: 140, opacity: saving ? 0.7 : 1 }}
          >
            {saving
              ? "Saving…"
              : modal === "edit"
              ? "Update Student"
              : "Admit Student"}
          </button>
        </div>
      </Modal>

      {/* ════════ MODAL: VIEW ════════ */}
      <Modal
        open={modal === "view"}
        onClose={() => setModal(null)}
        title="Student Profile"
        width={680}
      >
        {selected &&
          (() => {
            const enr = selected.enrolment;
            const primary = selected.guardians?.[0];
            const sec2 = selected.guardians?.[1];
            const fullName = [
              selected.first_name,
              selected.middle_name,
              selected.last_name,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div>
                <div
                  style={{
                    background: `linear-gradient(135deg,${C.surfaceAlt},${C.surface})`,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 16,
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background:
                        selected.gender === "GIRL"
                          ? `${C.purple}33`
                          : `${C.blue}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 800,
                      color: selected.gender === "GIRL" ? C.purple : C.blue,
                      border: `2px solid ${
                        selected.gender === "BOY" ? C.purple : C.blue
                      }55`,
                    }}
                  >
                    {(selected.first_name?.[0] || "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="syne"
                      style={{ fontSize: 18, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {fullName}
                    </div>
                    <div
                      style={{ color: C.textMuted, fontSize: 13, marginTop: 2 }}
                    >
                      {selected.admission_no && (
                        <span style={{ marginRight: 10 }}>
                          Adm# {selected.admission_no}
                        </span>
                      )}
                      {enr && (
                        <span style={{ color: C.primary, fontWeight: 600 }}>
                          {gradeName(enr.grade_id)} — Sec{" "}
                          {secName(enr.section_id)}
                          {enr.roll_no ? ` | Roll #${enr.roll_no}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span
                      className={`badge ${
                        selected.is_active ? "badge-green" : "badge-red"
                      }`}
                    >
                      {selected.is_active ? "Active" : "Inactive"}
                    </span>
                    {selected.is_ews && (
                      <span className="badge badge-yellow">EWS</span>
                    )}
                  </div>
                </div>

                <div
                  className="grid-2"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    ["Gender", selected.gender],
                    [
                      "Date of Birth",
                      selected.date_of_birth
                        ? new Date(selected.date_of_birth).toLocaleDateString(
                            "en-IN"
                          )
                        : "—",
                    ],
                    ["Blood Group", selected.blood_group || "—"],
                    ["Nationality", selected.nationality || "—"],
                    ["Religion", selected.religion || "—"],
                    ["Caste", selected.caste || "—"],
                    ["Aadhaar", selected.aadhaar_no || "—"],
                    [
                      "Adm. Date",
                      selected.admission_date
                        ? new Date(selected.admission_date).toLocaleDateString(
                            "en-IN"
                          )
                        : "—",
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: C.surfaceAlt,
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10.5,
                          color: C.textMuted,
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

                {(primary || sec2) && (
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textMuted,
                        textTransform: "uppercase",
                        fontWeight: 700,
                        marginBottom: 8,
                        letterSpacing: "0.5px",
                      }}
                    >
                      Guardians
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {[primary, sec2].filter(Boolean).map((g, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            minWidth: 200,
                            background: C.surfaceAlt,
                            borderRadius: 10,
                            padding: "10px 12px",
                            border: `1px solid ${C.border}55`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: i === 0 ? C.green : C.blue,
                              fontWeight: 700,
                              marginBottom: 4,
                            }}
                          >
                            {i === 0 ? "Primary" : "Secondary"} — {g.relation}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {g.full_name}
                          </div>
                          <div style={{ fontSize: 12, color: C.textMuted }}>
                            {g.phone}
                          </div>
                          {g.email && (
                            <div style={{ fontSize: 11, color: C.textMuted }}>
                              {g.email}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selected.address_permanent || selected.city) && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "10px 12px",
                      background: C.surfaceAlt,
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10.5,
                        color: C.textMuted,
                        textTransform: "uppercase",
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      Address
                    </div>
                    <div style={{ fontSize: 13 }}>
                      {[
                        selected.address_permanent,
                        selected.city,
                        selected.state,
                        selected.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 18,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="btn btn-ghost"
                    onClick={() => setModal(null)}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setModal(null);
                      openEdit(selected);
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Icon name="edit" size={13} /> Edit Profile
                    </span>
                  </button>
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* ════════ MODAL: DELETE CONFIRM ════════ */}
      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        title="Confirm Deletion"
        width={420}
      >
        {selected && (
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <div
              className="syne"
              style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}
            >
              Delete {selected.first_name} {selected.last_name}?
            </div>
            <div
              style={{
                color: C.textMuted,
                fontSize: 13,
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              This is a soft delete. Student record, enrolment, and guardian
              data will be archived and hidden from all views. This action can
              be reversed by a database admin.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn btn-ghost"
                onClick={() => setModal(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={saving}
                style={{ minWidth: 120, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ════════ MODAL: ISSUE TC ════════ */}
      <IssueTCModal
        student={tcStudent}
        onClose={() => setTcStudent(null)}
        onDone={() => {
          setTcStudent(null);
          loadAll();
        }}
      />

      {/* ════════ MODAL: BULK IMPORT ════════ */}
      <Modal
        open={modal === "bulk"}
        onClose={() => setModal(null)}
        title="Bulk CSV Import — Data Migration"
        width={750}
      >
        <div>
          <div
            style={{
              padding: "12px 14px",
              background: `${C.blue}11`,
              border: `1px solid ${C.blue}22`,
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.blue,
                marginBottom: 6,
              }}
            >
              CSV Column Order:
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {CSV_COLS.map((c, i) => (
                <span
                  key={c}
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    background: `${C.blue}22`,
                    color: C.blue,
                    padding: "2px 7px",
                    borderRadius: 4,
                  }}
                >
                  {i + 1}. {c}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>
              • Class & Section names must exactly match your setup
              (case-insensitive)
              <br />• date_of_birth format: YYYY-MM-DD&nbsp;&nbsp;• Header row
              required
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              className="btn btn-ghost"
              onClick={downloadSample}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
              }}
            >
              <Icon name="download" size={13} /> Download Template CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              className="btn btn-primary"
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
              }}
            >
              <Icon name="plus" size={13} /> Upload CSV File
            </button>
          </div>

          {bulkRows.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Preview:{" "}
                  <span style={{ color: C.green }}>
                    {bulkRows.filter((r) => r._errors.length === 0).length}{" "}
                    valid
                  </span>
                  {bulkErrors.length > 0 && (
                    <span style={{ color: C.red }}>
                      , {bulkErrors.length} with errors
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {bulkRows.length} total rows
                </div>
              </div>
              <div
                style={{
                  overflowX: "auto",
                  maxHeight: 300,
                  overflowY: "auto",
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                }}
              >
                <table className="table" style={{ fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Name</th>
                      <th>Adm#</th>
                      <th>DOB</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Guardian</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          background: row._errors.length
                            ? `${C.red}08`
                            : "transparent",
                        }}
                      >
                        <td style={{ color: C.textMuted }}>{row._line}</td>
                        <td style={{ fontWeight: 600 }}>
                          {[row.first_name, row.middle_name, row.last_name]
                            .filter(Boolean)
                            .join(" ")}
                        </td>
                        <td style={{ fontFamily: "monospace" }}>
                          {row.admission_no || "—"}
                        </td>
                        <td>{row.date_of_birth || "—"}</td>
                        <td>{row.class_name || "—"}</td>
                        <td>{row.section_name || "—"}</td>
                        <td>{row.guardian_name || "—"}</td>
                        <td>
                          {row._errors.length === 0 ? (
                            <span
                              className="badge badge-green"
                              style={{ fontSize: 10 }}
                            >
                              ✓ Valid
                            </span>
                          ) : (
                            <span
                              title={row._errors.join(", ")}
                              className="badge badge-red"
                              style={{ fontSize: 10, cursor: "help" }}
                            >
                              ⚠ {row._errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 16,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn btn-ghost"
                  onClick={() => setBulkRows([])}
                >
                  Clear
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleBulkImport}
                  disabled={
                    bulkLoading ||
                    bulkRows.filter((r) => r._errors.length === 0).length === 0
                  }
                  style={{ minWidth: 160, opacity: bulkLoading ? 0.7 : 1 }}
                >
                  {bulkLoading
                    ? "Importing…"
                    : `Import ${
                        bulkRows.filter((r) => r._errors.length === 0).length
                      } Students`}
                </button>
              </div>
            </div>
          )}

          {bulkRows.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "30px 0",
                color: C.textMuted,
                fontSize: 13,
              }}
            >
              Upload a CSV file to preview students before importing.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
