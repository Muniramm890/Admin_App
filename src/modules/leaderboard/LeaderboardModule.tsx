// FILE: teacher-app/src/modules/leaderboard/LeaderboardModule.tsx
// Source: admin App.tsx -> LeaderboardModule [19777-20141]
// @ts-nocheck
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { CLASSES, CLASS_SUBJECTS, MARKS_DATA, SECTIONS, STUDENTS } from "../../data/mockData";
import { C } from "../../theme/theme";

// ═══════════════════════════════════════════════════════════════
// MODULE: LEADERBOARD
// ═══════════════════════════════════════════════════════════════
export const LeaderboardModule = () => {
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [tab, setTab] = useState("overall");

  const getStudentScore = (s) => {
    const m = MARKS_DATA[s.id] || {};
    const subs = CLASS_SUBJECTS[s.class] || [];
    let total = 0,
      max = 0;
    subs.forEach((sub) => {
      const sm = m[sub] || {};
      total += sm.annual || 0;
      max += 100;
    });
    return max > 0 ? Math.round((total / max) * 100) : 0;
  };

  const ranked = [...STUDENTS]
    .filter((s) => !filterClass || s.class === filterClass)
    .filter((s) => !filterSection || s.section === filterSection)
    .map((s) => ({
      ...s,
      score: getStudentScore(s),
      subjects: Object.fromEntries(
        (CLASS_SUBJECTS[s.class] || []).map((sub) => [
          sub,
          MARKS_DATA[s.id]?.[sub]?.annual || 0,
        ])
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, schoolRank: i + 1 }));

  const classRanked = (cls, sec) =>
    [...STUDENTS]
      .filter((s) => s.class === cls && (!sec || s.section === sec))
      .map((s) => ({ ...s, score: getStudentScore(s) }))
      .sort((a, b) => b.score - a.score)
      .map((s, i) => ({ ...s, classRank: i + 1 }));

  const getMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="slide-in">
      <SectionHeader
        title="School Leaderboard"
        sub="Rankings and performance overview"
      />
      <div
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
        {["overall", "class"].map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "overall" ? "Overall School" : "Class-wise"}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            className="select"
            style={{ width: 140 }}
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setFilterSection("");
            }}
          >
            <option value="">All Classes</option>
            {CLASSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {filterClass && (
            <select
              className="select"
              style={{ width: 130 }}
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="">All Sections</option>
              {(SECTIONS[filterClass] || []).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {ranked.slice(0, 3).map((s, i) => (
          <div
            key={s.id}
            style={{
              textAlign: "center",
              background: C.surface,
              border: `2px solid ${
                [C.yellow, C.textMuted + "88", C.primary + "66"][i]
              }`,
              borderRadius: 20,
              padding: "20px 24px",
              minWidth: 150,
              transform: i === 0 ? "translateY(-12px)" : "none",
            }}
          >
            <div style={{ fontSize: 32 }}>{getMedal(i + 1)}</div>
            <div style={{ fontSize: 28, marginTop: 4 }}>{s.photo}</div>
            <div
              className="syne"
              style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}
            >
              {s.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted }}>
              {s.class} {s.section}
            </div>
            <div
              className="syne"
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: [C.yellow, C.textMuted, C.primary][i],
                marginTop: 6,
              }}
            >
              {s.score}%
            </div>
          </div>
        ))}
      </div>

      <div
        className="grid-2"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}
      >
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Class</th>
                <th>Score</th>
                <th>Subject Performance</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 15).map((s) => (
                <tr key={s.id}>
                  <td
                    className="syne"
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color:
                        s.schoolRank <= 3
                          ? [C.yellow, C.textMuted, C.primary][s.schoolRank - 1]
                          : C.textMuted,
                    }}
                  >
                    {getMedal(s.schoolRank)}
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontSize: 20 }}>{s.photo}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>
                          Roll #{s.rollNo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {s.class.replace("Class ", "C")}-{s.section}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${s.score}%`,
                            background:
                              s.score >= 80
                                ? C.green
                                : s.score >= 60
                                ? C.yellow
                                : C.red,
                          }}
                        />
                      </div>
                      <span
                        className="syne"
                        style={{
                          fontWeight: 700,
                          color:
                            s.score >= 80
                              ? C.green
                              : s.score >= 60
                              ? C.yellow
                              : C.red,
                        }}
                      >
                        {s.score}%
                      </span>
                    </div>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {Object.entries(s.subjects)
                        .slice(0, 4)
                        .map(([sub, marks]) => (
                          <span
                            key={sub}
                            style={{
                              fontSize: 9,
                              background: `${marks >= 60 ? C.green : C.red}22`,
                              color: marks >= 60 ? C.green : C.red,
                              border: `1px solid ${
                                marks >= 60 ? C.green : C.red
                              }44`,
                              borderRadius: 4,
                              padding: "1px 4px",
                            }}
                          >
                            {sub.slice(0, 3)}:{marks}
                          </span>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3
              className="syne"
              style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}
            >
              Score Distribution
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={[
                  {
                    r: "90-100",
                    n: ranked.filter((s) => s.score >= 90).length,
                  },
                  {
                    r: "80-89",
                    n: ranked.filter((s) => s.score >= 80 && s.score < 90)
                      .length,
                  },
                  {
                    r: "70-79",
                    n: ranked.filter((s) => s.score >= 70 && s.score < 80)
                      .length,
                  },
                  {
                    r: "60-69",
                    n: ranked.filter((s) => s.score >= 60 && s.score < 70)
                      .length,
                  },
                  { r: "<60", n: ranked.filter((s) => s.score < 60).length },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="r" tick={{ fill: C.textMuted, fontSize: 10 }} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                  }}
                />
                <Bar dataKey="n" radius={[5, 5, 0, 0]} fill={C.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3
              className="syne"
              style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}
            >
              Quick KPIs
            </h3>
            {[
              {
                l: "School Average",
                v: `${Math.round(
                  ranked.reduce((s, r) => s + r.score, 0) /
                    Math.max(ranked.length, 1)
                )}%`,
                c: C.primary,
              },
              { l: "Top Score", v: `${ranked[0]?.score || 0}%`, c: C.green },
              {
                l: "Pass Rate (33%+)",
                v: `${Math.round(
                  (ranked.filter((s) => s.score >= 33).length /
                    Math.max(ranked.length, 1)) *
                    100
                )}%`,
                c: C.blue,
              },
              { l: "Students Tracked", v: ranked.length, c: C.cyan },
            ].map((k, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom: `1px solid ${C.border}22`,
                }}
              >
                <span style={{ fontSize: 12, color: C.textMuted }}>{k.l}</span>
                <span
                  className="syne"
                  style={{ fontSize: 16, fontWeight: 800, color: k.c }}
                >
                  {k.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
