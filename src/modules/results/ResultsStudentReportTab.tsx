// FILE: teacher-app/src/modules/results/ResultsStudentReportTab.tsx
// Source: admin App.tsx -> ResultsStudentReportTab [19338-19595]
// @ts-nocheck
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiRequest } from "../../api/client";
import { Icon } from "../../components/ui/Icon";
import { openGeneratedPdf } from "../../utils/fetchDoc";
import { C } from "../../theme/theme";

   // ─────────────────────────────────────────────────────────────
   // ─────────────────────────────────────────────────────────────

// special mark statuses -> [short label, long label]
const ST_LABEL = { absent: ["AB", "Absent"], malpractice: ["MP", "Malpractice"], leave: ["L", "Leave"], tc: ["TC", "TC"], exempted: ["EX", "Exempt"] };

export const ResultsStudentReportTab = ({ examGroupId, examName, school }) => {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [availableSections, setAvailableSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [studentsList, setStudentsList] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [search, setSearch] = useState("");

  const [report, setReport] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch available sections (Only those which have computed results for this Exam)
  useEffect(() => {
    if (!examGroupId) return;
    setLoading(true);
    apiRequest(`/results/section-wise?exam_group_id=${examGroupId}`)
      .then((res) => {
        const secs = Array.isArray(res?.data) ? res.data : [];
        setAvailableSections(secs);
        if (secs.length > 0) {
          setSectionId(secs[0].section_id);
        } else {
          setSectionId("");
        }
        setStudentId("");
        setReport(null);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [examGroupId]);

    // 2. Fetch students only for the selected section
  useEffect(() => {
    if (!sectionId || !examGroupId) {
      setStudentsList([]);
      return;
    }
    setLoading(true);
    apiRequest(`/results/section-results?exam_group_id=${examGroupId}&section_id=${sectionId}`)
      .then((res) => {
        setStudentsList(Array.isArray(res?.data) ? res.data : []);
        setStudentId("");
        setReport(null);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [sectionId, examGroupId]);

  // 3. Fetch Report Card & Trend for the selected student
  useEffect(() => {
    if (!studentId || !examGroupId) {
      setReport(null);
      setTrend([]);
      return;
    }
    setLoading(true);
    Promise.all([
      apiRequest(`/results/student/${studentId}/report-card?exam_group_id=${examGroupId}`).catch(() => null),
      apiRequest(`/results/student/${studentId}/trend`).catch(() => null),
    ])
      .then(([repRes, trendRes]) => {
        setReport(repRes?.data || null);
        setTrend(Array.isArray(trendRes?.data) ? trendRes.data : []);
      })
      .finally(() => setLoading(false));
  }, [studentId, examGroupId]);

  // Filter students based on the search box
  const filteredStudents = studentsList.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (s.student_name || "").toLowerCase();
    const roll = String(s.roll_no || "").toLowerCase(); 
    return name.includes(q) || roll.includes(q);
  });

  const selectedStudentMeta = studentsList.find(s => s.student_id === studentId);

  const handleGenerateSingle = async () => {
    if (!studentId || !examGroupId) return;
    setGeneratingPdf(true);
    try {
      await openGeneratedPdf(`/results/student/${studentId}/report-card/pdf?exam_group_id=${examGroupId}`, { name: "Report Card.pdf", title: "Report Card" });
    } catch (e) {
      alert("Failed to generate report card: " + e.message);
    } finally {
      setGeneratingPdf(false);
    }
  };
  
  const handleGenerateBulk = async () => {
    if (!sectionId || !examGroupId) return;
    setBulkGenerating(true);
    try {
      await openGeneratedPdf(`/results/report-cards/bulk?section_id=${sectionId}&exam_group_id=${examGroupId}`, { name: "Report Cards.pdf", title: "Report Cards" });
    } catch (e) {
      alert("Failed to generate bulk report cards: " + e.message);
    } finally {
      setBulkGenerating(false);
    }
  };

  return (
    <div>
            <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="select"
            style={{ width: 200 }}
            value={sectionId}
            onChange={(e) => { setSectionId(e.target.value); setSearch(""); }}
            disabled={availableSections.length === 0}
          >
            {availableSections.length === 0 && <option value="">No Results Computed Yet</option>}
            {availableSections.length > 0 && <option value="">-- Class & Section --</option>}
            {availableSections.map((s) => (
              <option key={s.section_id} value={s.section_id}>{s.grade_name} — Sec {s.section_name}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Search name/roll…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!sectionId}
            style={{ width: 160 }}
          />
          <select
            className="select"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={!sectionId}
            style={{ flex: 1, minWidth: 180 }}
          >
            <option value="">-- Select Student --</option>
            {filteredStudents.map((s) => (
              <option key={s.student_id} value={s.student_id}>{s.roll_no ? `${s.roll_no} - ` : ""}{s.student_name}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleGenerateSingle}
            disabled={!studentId || !report || generatingPdf}
            style={{ display: "flex", alignItems: "center", gap: 6, opacity: (!studentId || !report || generatingPdf) ? 0.5 : 1 }}
          >
            <Icon name="download" size={14} /> {generatingPdf ? "Generating…" : "Report Card"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleGenerateBulk}
            disabled={!sectionId || bulkGenerating}
            style={{ display: "flex", alignItems: "center", gap: 6, opacity: (!sectionId || bulkGenerating) ? 0.5 : 1 }}
          >
            <Icon name="students" size={14} /> {bulkGenerating ? "Generating…" : `Print All (${studentsList.length})`}
          </button>
        </div>
      </div>

      {!studentId ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
          {availableSections.length === 0 
            ? "No results have been processed for this Exam yet. Please go to 'Results & Publish' to compute them."
            : "Select a class, section, and student to view their report card and exam trend."}
        </div>
      ) : loading ? (
        <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 30 }}>Loading Report Card…</div>
      ) : (
        <>
          {trend.length > 1 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 className="syne" style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                Performance Trend — {selectedStudentMeta?.student_name}
              </h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="exam_name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="percentage" stroke={C.primary} strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!report ? (
            <div className="card" style={{ padding: 30, textAlign: "center", color: C.textMuted }}>
              No result data found for this student in the selected exam.
            </div>
          ) : (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 className="syne" style={{ fontSize: 18, fontWeight: 800 }}>
                    {selectedStudentMeta?.student_name}
                  </h3>
                  <span className={`badge ${report.status === "pass" ? "badge-green" : report.status === "incomplete" ? "badge-yellow" : "badge-red"}`}>
                    {report.status?.toUpperCase()}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="syne" style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>{report.percentage}%</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>
                    Grade <b style={{color: C.text}}>{report.grade}</b> · Class Rank <b style={{color: C.text}}>{report.class_rank ? `#${report.class_rank}` : "-"}</b> · School Rank <b style={{color: C.text}}>{report.school_rank ? `#${report.school_rank}` : "-"}</b>
                  </div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ minWidth: 520 }}>
                <thead><tr><th>Subject</th><th>Marks Obtained</th><th>Max Marks</th><th>Status</th></tr></thead>
                <tbody>
                {report.subjects?.map((s, i) => (
                    <tr key={i}>
                      <td>
                        {s.subject_name} 
                        {s.is_grade_only ? <span style={{fontSize: 9, marginLeft: 6, color: C.textMuted}}>(Graded)</span> : null}
                      </td>
                      <td className="syne" style={{ fontWeight: 700 }}>
                        {ST_LABEL[s.status] ? ST_LABEL[s.status][0] : s.is_grade_only ? (s.grade_obtained || "-") : (s.marks_obtained ?? "-")}
                      </td>
                      <td>{s.is_grade_only ? "-" : s.max_marks}</td>
                      <td>
                        {s.is_grade_only ? (
                           <span className="badge badge-yellow">Evaluated</span>
                        ) : (
                           <span className={`badge ${ST_LABEL[s.status] ? (["leave", "tc", "exempted"].includes(s.status) ? "badge-yellow" : "badge-red") : s.marks_obtained === null || s.marks_obtained === undefined ? "badge-yellow" : Number(s.marks_obtained) >= Number(s.passing_marks) ? "badge-green" : "badge-red"}`}>
                             {ST_LABEL[s.status] ? ST_LABEL[s.status][1] : s.marks_obtained === null || s.marks_obtained === undefined ? "Pending" : Number(s.marks_obtained) >= Number(s.passing_marks) ? "Pass" : "Fail"}
                           </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
