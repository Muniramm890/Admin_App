// FILE: teacher-app/src/modules/results/ResultsOverviewTab.tsx
// Source: admin App.tsx -> ResultsOverviewTab [18979-19018]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { KpiCard } from "../../components/ui/KpiCard";
import { C } from "../../theme/theme";

// ─────────────────────────────────────────────────────────────
export const ResultsOverviewTab = ({ examGroupId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/results/overview?exam_group_id=${examGroupId}`)
      .then((res) => setData(res?.data || null))
      .catch((e) => { console.error(e); setData(null); })
      .finally(() => setLoading(false));
  }, [examGroupId]);

  if (loading) return <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 30 }}>Loading…</div>;
  if (!data || !data.total_appeared) return <div className="card" style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No data yet — compute results first.</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 16 }}>
        <KpiCard label="Appeared" value={data.total_appeared} color={C.primary} />
        <KpiCard label="Passed" value={data.total_pass} color={C.green} sub={`${data.pass_percent}% pass rate`} />
        <KpiCard label="Failed" value={data.total_fail} color={C.red || "#e11d48"} />
        <KpiCard label="Incomplete" value={data.total_incomplete} color={C.yellow} sub="Marks pending entry" />
        <KpiCard label="Average %" value={`${data.avg_percentage}%`} color={C.purple} />
        <KpiCard label="Highest %" value={`${data.highest_percentage ?? "-"}%`} color={C.blue} />
      </div>
      {data.topper && (
        <div className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 34 }}>🏆</div>
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase" }}>School Topper</div>
            <div className="syne" style={{ fontSize: 16, fontWeight: 700 }}>{data.topper.full_name}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>
              {data.topper.grade_name} - {data.topper.section_name} · {data.topper.percentage}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
