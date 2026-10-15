// FILE: teacher-app/src/modules/commhub/TargetRow.tsx
// Source: admin App.tsx -> TargetRow [10134-10188]
// @ts-nocheck
import { Icon } from "../../components/ui/Icon";
import { StudentPicker } from "./StudentPicker";
import { TARGET_TYPE_META } from "./helpers";
import { C } from "../../theme/theme";
import { ROLE_META } from "../../utils/roles";

// -- Single target-row editor (used inside the target list builder) --
export const TargetRow = ({ target, onChange, onRemove, grades, sections, subjects }) => {
  const sectionsForGrade = target.grade_id ? sections.filter((s) => s.grade_id === target.grade_id) : sections;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 12, background: C.bgAlt, borderRadius: 10, marginBottom: 8, flexWrap: "wrap" }}>
      <select className="select" style={{ width: 190 }} value={target.target_type} onChange={(e) => onChange({ ...target, target_type: e.target.value })}>
        {Object.entries(TARGET_TYPE_META).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
      </select>

      {(target.target_type === "grade" || target.target_type === "section" || target.target_type === "gender_in_section" || target.target_type === "class_teachers") && (
        <select className="select" style={{ width: 140 }} value={target.grade_id || ""} onChange={(e) => onChange({ ...target, grade_id: e.target.value, section_id: "" })}>
          <option value="">Select grade</option>
          {grades.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
        </select>
      )}

      {(target.target_type === "section" || target.target_type === "gender_in_section" || target.target_type === "class_teachers") && (
        <select className="select" style={{ width: 140 }} value={target.section_id || ""} onChange={(e) => onChange({ ...target, section_id: e.target.value })}>
          <option value="">Select section</option>
          {sectionsForGrade.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      )}

      {target.target_type === "gender_in_section" && (
        <select className="select" style={{ width: 110 }} value={target.gender || ""} onChange={(e) => onChange({ ...target, gender: e.target.value })}>
          <option value="">Gender</option>
          <option value="male">Boys</option>
          <option value="female">Girls</option>
        </select>
      )}

      {target.target_type === "subject_teachers" && (
        <select className="select" style={{ width: 170 }} value={target.subject_id || ""} onChange={(e) => onChange({ ...target, subject_id: e.target.value })}>
          <option value="">Select subject</option>
          {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      )}

      {target.target_type === "role" && (
        <select className="select" style={{ width: 150 }} value={target.role || ""} onChange={(e) => onChange({ ...target, role: e.target.value })}>
          <option value="">Select role</option>
          {Object.entries(ROLE_META).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
      )}

      {target.target_type === "student" && (
        <StudentPicker value={target.student_id} label={target.student_label} onPick={(id, label) => onChange({ ...target, student_id: id, student_label: label })} />
      )}

      <button className="btn btn-ghost" style={{ padding: "6px 10px", marginLeft: "auto" }} onClick={onRemove} title="Remove">
        <Icon name="trash" size={13} />
      </button>
    </div>
  );
};
