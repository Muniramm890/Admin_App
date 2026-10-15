// FILE: teacher-app/src/modules/results/ResultsToppersTab.tsx
// Source: admin App.tsx -> ResultsToppersTab [19288-19333]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { C } from "../../theme/theme";

// ─────────────────────────────────────────────────────────────
export const ResultsToppersTab = ({ examGroupId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/results/toppers?exam_group_id=${examGroupId}&limit=${limit}`)
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [examGroupId, limit]);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 className="syne" style={{ fontSize: 15, fontWeight: 700 }}>🏆 School Toppers</h3>
        <select className="select" style={{ width: 100 }} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          {[5, 10, 20, 50].map((v) => <option key={v} value={v}>Top {v}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 20 }}>Loading…</div>
      ) : !rows.length ? (
        <div style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No data yet.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 480 }}>
          <thead><tr><th>Rank</th><th>Name</th><th>Class</th><th>%</th><th>Grade</th></tr></thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.student_id}>
                <td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : s.school_rank}</td>
                <td>{s.student_name}</td>
                <td>{s.grade_name} - {s.section_name}</td>
                <td>{s.percentage}%</td>
                <td>{s.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};
