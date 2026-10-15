// FILE: teacher-app/src/modules/attendance/useGradesAndSections.ts
// Source: admin App.tsx -> useGradesAndSections [12308-12331]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";

// ═══════════════════════════════════════════════════════════════
// SHARED: Grade/Section selector (students side)
// ═══════════════════════════════════════════════════════════════
export const useGradesAndSections = () => {
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          apiRequest("/setup/grades"),
          apiRequest("/setup/sections"),
        ]);
        setGrades(Array.isArray(gRes?.data) ? gRes.data : []);
        setSections(Array.isArray(sRes?.data) ? sRes.data : []);
      } catch (e) {
        console.error("Failed to load grades/sections", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { grades, sections, loading };
};
