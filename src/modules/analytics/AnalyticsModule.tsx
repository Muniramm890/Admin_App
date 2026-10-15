// FILE: teacher-app/src/modules/analytics/AnalyticsModule.tsx
// Source: admin App.tsx -> AnalyticsModule [22003-22423]
// @ts-nocheck
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "../../components/ui/KpiCard";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { CLASSES, CLASS_SUBJECTS, MARKS_DATA, SECTIONS, STUDENTS } from "../../data/mockData";
import { C } from "../../theme/theme";

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION LOGIC & LOGIN UI (ADDED AT BOTTOM)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// MODULE: ANALYTICS
// ═══════════════════════════════════════════════════════════════

export const AnalyticsModule = () => {
  const [selClass, setSelClass] = useState("Class 9");
  const [selSection, setSelSection] = useState("A");

  const classStudents = STUDENTS.filter(
    (s) => s.class === selClass && s.section === selSection
  );
  const subjects = CLASS_SUBJECTS[selClass] || [];

  const subjectStats = subjects.map((sub) => {
    const marks = classStudents.map(
      (s) => MARKS_DATA[s.id]?.[sub]?.annual || 0
    );
    const avg = marks.length
      ? Math.round(marks.reduce((s, v) => s + v, 0) / marks.length)
      : 0;
    const max = marks.length ? Math.max(...marks) : 0;
    const min = marks.length ? Math.min(...marks) : 0;
    const pass = marks.filter((v) => v >= 33).length;
    return { sub, avg, max, min, pass, total: marks.length };
  });

  const getScore = (s) => {
    let total = 0,
      max = 0;
    subjects.forEach((sub) => {
      total += MARKS_DATA[s.id]?.[sub]?.annual || 0;
      max += 100;
    });
    return max > 0 ? Math.round((total / max) * 100) : 0;
  };

  const scoreCategories = [
    { label: "Outstanding (90-100%)", min: 90, max: 100, color: C.green },
    { label: "Excellent (75-89%)", min: 75, max: 89, color: C.cyan },
    { label: "Good (60-74%)", min: 60, max: 74, color: C.blue },
    { label: "Average (45-59%)", min: 45, max: 59, color: C.yellow },
    { label: "Below Average (<45%)", min: 0, max: 44, color: C.red },
  ].map((cat) => ({
    ...cat,
    count: classStudents.filter((s) => {
      const sc = getScore(s);
      return sc >= cat.min && sc <= cat.max;
    }).length,
  }));

  const trajectoryData = ["UT1", "UT2", "Half Yearly", "Annual"].map(
    (exam, ei) => {
      const key = ["ut1", "ut2", "half", "annual"][ei];
      const max = [20, 20, 80, 100][ei];
      const avg = Math.round(
        classStudents.reduce(
          (s, st) =>
            s +
            subjects.reduce(
              (ss, sub) => ss + (MARKS_DATA[st.id]?.[sub]?.[key] || 0),
              0
            ) /
              Math.max(subjects.length, 1),
          0
        ) / Math.max(classStudents.length, 1)
      );
      return { exam, avg, max, pct: Math.round((avg / max) * 100) };
    }
  );

  return (
    <div className="slide-in">
      <SectionHeader
        title="Academic Analytics"
        sub="Deep performance insights, trends and subject analysis"
      />
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            className="select"
            style={{ width: 140 }}
            value={selClass}
            onChange={(e) => setSelClass(e.target.value)}
          >
            {CLASSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 130 }}
            value={selSection}
            onChange={(e) => setSelSection(e.target.value)}
          >
            {(SECTIONS[selClass] || []).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginBottom: 20,
        }}
        className="grid-4"
      >
        <KpiCard
          label="Class Strength"
          value={classStudents.length}
          icon="students"
          color={C.blue}
        />
        <KpiCard
          label="Class Average"
          value={`${Math.round(
            classStudents.reduce((s, st) => s + getScore(st), 0) /
              Math.max(classStudents.length, 1)
          )}%`}
          icon="chart"
          color={C.primary}
        />
        <KpiCard
          label="Topper"
          value={
            classStudents.length
              ? Math.max(...classStudents.map(getScore)) + "%"
              : "—"
          }
          icon="trophy"
          color={C.yellow}
        />
        <KpiCard
          label="Pass Rate"
          value={`${Math.round(
            (classStudents.filter((s) => getScore(s) >= 33).length /
              Math.max(classStudents.length, 1)) *
              100
          )}%`}
          icon="check"
          color={C.green}
        />
      </div>

      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div className="card">
          <h3
            className="syne"
            style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
          >
            Academic Trajectory
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trajectoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis
                dataKey="exam"
                tick={{ fill: C.textMuted, fontSize: 10 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: C.textMuted, fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                }}
                formatter={(v) => `${v}%`}
              />
              <Line
                type="monotone"
                dataKey="pct"
                stroke={C.primary}
                strokeWidth={3}
                dot={{ r: 5, fill: C.primary }}
                name="Class Avg %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3
            className="syne"
            style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
          >
            Student Distribution
          </h3>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {scoreCategories.map((cat, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{ fontSize: 12, color: cat.color, fontWeight: 600 }}
                  >
                    {cat.label}
                  </span>
                  <span className="syne" style={{ fontWeight: 700 }}>
                    {cat.count}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        classStudents.length > 0
                          ? (cat.count / classStudents.length) * 100
                          : 0
                      }%`,
                      background: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3
          className="syne"
          style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
        >
          Subject-wise Analysis
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Average</th>
                <th>Highest</th>
                <th>Lowest</th>
                <th>Pass Rate</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {subjectStats.map((s) => {
                const passRate =
                  s.total > 0 ? Math.round((s.pass / s.total) * 100) : 0;
                return (
                  <tr key={s.sub}>
                    <td style={{ fontWeight: 600 }}>{s.sub}</td>
                    <td>
                      <span
                        className="syne"
                        style={{
                          fontWeight: 700,
                          color:
                            s.avg >= 60
                              ? C.green
                              : s.avg >= 40
                              ? C.yellow
                              : C.red,
                        }}
                      >
                        {s.avg}/100
                      </span>
                    </td>
                    <td style={{ color: C.green, fontWeight: 600 }}>{s.max}</td>
                    <td style={{ color: C.red, fontWeight: 600 }}>{s.min}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${passRate}%`,
                              background:
                                passRate >= 80
                                  ? C.green
                                  : passRate >= 60
                                  ? C.yellow
                                  : C.red,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              passRate >= 80
                                ? C.green
                                : passRate >= 60
                                ? C.yellow
                                : C.red,
                          }}
                        >
                          {passRate}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 3 }}>
                        {["Top", "Good", "Avg", "Low"].map((l, i) => {
                          const ranges = [
                            [80, 100],
                            [60, 79],
                            [40, 59],
                            [0, 39],
                          ];
                          const cnt = classStudents.filter((st) => {
                            const m = MARKS_DATA[st.id]?.[s.sub]?.annual || 0;
                            return m >= ranges[i][0] && m <= ranges[i][1];
                          }).length;
                          const colors = [C.green, C.cyan, C.yellow, C.red];
                          return cnt > 0 ? (
                            <span
                              key={l}
                              style={{
                                fontSize: 9,
                                background: `${colors[i]}22`,
                                color: colors[i],
                                border: `1px solid ${colors[i]}44`,
                                borderRadius: 4,
                                padding: "1px 5px",
                              }}
                            >
                              {cnt}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3
          className="syne"
          style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
        >
          Top Performers
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
            gap: 12,
          }}
        >
          {[...classStudents]
            .sort((a, b) => getScore(b) - getScore(a))
            .slice(0, 6)
            .map((s, i) => (
              <div
                key={s.id}
                style={{
                  background: C.surfaceAlt,
                  border: `1px solid ${
                    i < 3
                      ? [C.yellow, C.textMuted + "88", C.primary + "66"][i]
                      : C.border
                  }`,
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>
                  {["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣"][i]}
                </div>
                <div style={{ fontSize: 22 }}>{s.photo}</div>
                <div
                  className="syne"
                  style={{ fontWeight: 700, fontSize: 13, marginTop: 6 }}
                >
                  {s.name.split(" ")[0]}
                </div>
                <div style={{ color: C.textMuted, fontSize: 11 }}>
                  Roll #{s.rollNo}
                </div>
                <div
                  className="syne"
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color:
                      i < 3 ? [C.yellow, C.textMuted, C.primary][i] : C.primary,
                    marginTop: 4,
                  }}
                >
                  {getScore(s)}%
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
