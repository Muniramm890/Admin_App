// FILE: teacher-app/src/contexts/DataContext.tsx
// Source: admin App.tsx -> DataContext [23735-23735], useData [23738-23738], DataProvider [25657-25699]
// @ts-nocheck
import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "./AuthContext";
import { STUDENTS, TEACHERS } from "../data/mockData";

  export const DataContext = createContext(); // 🔴 SMART GLOBAL DATA CONTEXT

  export const useData = () => useContext(DataContext);

// Gatekeeper Component: Check karta hai user logged in hai ya nahi
// 🔴 DATA PROVIDER: Fetch once from Azure, use everywhere
export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [appData, setAppData] = useState({
    students: STUDENTS, // Fallback to global mock data so nothing breaks
    teachers: TEACHERS,
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      try {
        
        const [studentsRes, teachersRes] = await Promise.all([
          apiRequest("/students?limit=2000"),
          apiRequest("/teachers"),
        ]);

        const realStudents = studentsRes?.data || [];
        const realTeachers = teachersRes?.data || [];

        setAppData({
          students: realStudents.length > 0 ? realStudents : STUDENTS,
          teachers: realTeachers.length > 0 ? realTeachers : TEACHERS,
          loading: false,
        });
      } catch (err) {
        console.warn(
          "Using fallback Mock Data. API failed or not ready yet:",
          err.message
        );
        setAppData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchAllData();
  }, [user]);

  return (
    <DataContext.Provider value={appData}>{children}</DataContext.Provider>
  );
};
