// FILE: teacher-app/src/modules/commhub/ComposeMessageTab.tsx
// Source: admin App.tsx -> ComposeMessageTab [10232-10438]
// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../api/client";
import { FormGrid } from "../../components/ui/FormGrid";
import { FormRow } from "../../components/ui/FormRow";
import { TargetRow } from "./TargetRow";
import { ATTACHMENT_CHANNEL_MATRIX, detectAttachmentType } from "./helpers";
import { C } from "../../theme/theme";

export const ComposeMessageTab = ({ academicYearId, onSent }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [channels, setChannels] = useState({ app: true, email: false, sms: false });
  const [targets, setTargets] = useState([{ target_type: "all_school" }]);
  const [files, setFiles] = useState([]);

  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!academicYearId) return;
    Promise.all([
      apiRequest(`/setup/grades`),
      apiRequest(`/setup/sections?academic_year_id=${academicYearId}`),
      apiRequest(`/setup/subjects`),
    ]).then(([gRes, secRes, subRes]) => {
      setGrades(gRes?.data || []);
      setSections(secRes?.data || []);
      setSubjects(subRes?.data || []);
    }).catch((e) => console.error(e.message));
  }, [academicYearId]);

  // Strictest attachment type present decides which channels are even selectable
  const strictestType = useMemo(() => {
    if (files.length === 0) return "none";
    const rank = { none: 0, image: 1, pdf: 1, document: 1, video: 2 };
    let worst = "none";
    files.forEach((f) => { const t = detectAttachmentType(f); if (rank[t] > rank[worst]) worst = t; });
    return worst;
  }, [files]);

  const allowedChannels = ATTACHMENT_CHANNEL_MATRIX[strictestType];

  // Auto-uncheck any channel that becomes invalid the moment attachments change
  useEffect(() => {
    setChannels((p) => {
      const next = { ...p };
      Object.keys(next).forEach((k) => { if (next[k] && !allowedChannels.includes(k)) next[k] = false; });
      return next;
    });
  }, [strictestType]); // eslint-disable-line

  const toggleChannel = (ch) => setChannels((p) => ({ ...p, [ch]: !p[ch] }));

  const addTarget = () => setTargets((p) => [...p, { target_type: "section" }]);
  const updateTarget = (idx, t) => setTargets((p) => p.map((x, i) => (i === idx ? t : x)));
  const removeTarget = (idx) => setTargets((p) => p.filter((_, i) => i !== idx));

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (files.length + picked.length > 3) { setError("Max 3 attachments per message"); return; }
    setFiles((p) => [...p, ...picked]);
    setError("");
  };
  const removeFile = (i) => setFiles((p) => p.filter((_, idx) => idx !== i));

  const cleanTargets = () => targets.map((t) => ({
    target_type: t.target_type,
    grade_id: t.grade_id || undefined,
    section_id: t.section_id || undefined,
    subject_id: t.subject_id || undefined,
    student_id: t.student_id || undefined,
    gender: t.gender || undefined,
    role: t.role || undefined,
  }));

  const handlePreview = async () => {
    setPreviewing(true);
    setError("");
    try {
      const res = await apiRequest("/comm/preview", "POST", { academic_year_id: academicYearId, targets: cleanTargets() });
      setPreview(res?.data || null);
    } catch (e) { setError(e.message); }
    finally { setPreviewing(false); }
  };

  const selectedChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and message are required"); return; }
    if (selectedChannels.length === 0) { setError("Select at least one channel"); return; }

    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("body", body.trim());
      fd.append("category", category);
      fd.append("channels", JSON.stringify(selectedChannels));
      fd.append("targets", JSON.stringify(cleanTargets()));
      fd.append("academic_year_id", academicYearId);
      files.forEach((f) => fd.append("attachments", f));

      const res = await apiRequest("/comm/messages", "POST", fd, true);
      setResult(res?.data || null);
      setTitle(""); setBody(""); setTargets([{ target_type: "all_school" }]); setFiles([]); setPreview(null);
      setTimeout(() => onSent?.(), 1200);
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  };

  return (
    <div>
      <FormGrid cols={1}>
        <FormRow label="Title">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PTM on Saturday" />
        </FormRow>
        <FormRow label="Message">
          <textarea className="input" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." />
        </FormRow>
        <FormRow label="Category">
          <select className="select" style={{ width: 200 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="exam">Exam</option>
            <option value="fee">Fee</option>
            <option value="event">Event</option>
            <option value="emergency">Emergency</option>
          </select>
        </FormRow>
      </FormGrid>

      <div style={{ margin: "18px 0" }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>Attachment (optional -- max 3, image/PDF/document/video)</div>
        <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,video/*" onChange={handleFilePick} disabled={files.length >= 3} />
        {files.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: C.bgAlt, borderRadius: 8, fontSize: 12 }}>
                {f.name}
                <button onClick={() => removeFile(i)} style={{ border: "none", background: "none", cursor: "pointer", color: C.red }}>x</button>
              </div>
            ))}
          </div>
        )}
        {strictestType !== "none" && (
          <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 6 }}>
            "{strictestType}" attachments can only be sent through these channels: <strong>{allowedChannels.join(", ")}</strong>
          </div>
        )}
      </div>

      <div style={{ margin: "18px 0" }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>Send Via</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { k: "app", label: "In-App Notification" },
            { k: "email", label: "Email" },
            { k: "sms", label: "SMS (coming soon)", alwaysDisabled: true },
          ].map((c) => {
            const disabled = c.alwaysDisabled || !allowedChannels.includes(c.k);
            return (
              <label key={c.k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
                <input type="checkbox" checked={channels[c.k]} disabled={disabled} onChange={() => toggleChannel(c.k)} />
                {c.label}
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ margin: "18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>Send To</div>
          <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "5px 10px" }} onClick={addTarget}>+ Add another audience</button>
        </div>
        {targets.map((t, i) => (
          <TargetRow key={i} target={t} grades={grades} sections={sections} subjects={subjects}
            onChange={(nt) => updateTarget(i, nt)} onRemove={() => removeTarget(i)} />
        ))}
      </div>

      {error && <div style={{ color: C.red, fontSize: 12.5, marginBottom: 12 }}>{error}</div>}

      {result && (
        <div style={{ padding: 14, background: `${C.green}11`, border: `1px solid ${C.green}33`, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          Sent -- status: <strong>{result.status}</strong>, recipients: <strong>{result.recipient_count}</strong>
          {result.attachment_count > 0 && <span>, attachments: <strong>{result.attachment_count}</strong></span>}
        </div>
      )}

      {preview && (
        <div style={{ padding: 12, background: `${C.blue}11`, border: `1px solid ${C.blue}33`, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          This message will reach <strong>{preview.total}</strong> people — <strong>{preview.students}</strong> students, <strong>{preview.staff}</strong> staff.
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" onClick={handlePreview} disabled={previewing}>
          {previewing ? "Checking..." : "Preview Recipients"}
        </button>
        <button className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ minWidth: 140, opacity: sending ? 0.7 : 1 }}>
          {sending ? "Sending..." : "Send Now"}
        </button>
      </div>
    </div>
  );
};
