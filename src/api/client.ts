// FILE: teacher-app/src/api/client.ts

// @ts-nocheck


export const API_BASE_URL = (() => {
  const url = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL;
  if (!url) throw new Error("VITE_API_URL not found in .env ");
  return url;
})();

  let authLogoutRef = null; 
export const setAuthLogoutRef = (fn) => { authLogoutRef = fn; }; 

  export const apiRequest = async (endpoint, method = "GET", body = null, isFormData = false) => {
    try {
      const token = localStorage.getItem("erp_token");
      const headers = { Accept: "application/json" };
      if (!isFormData) headers["Content-Type"] = "application/json";
      if (token && token !== "undefined" && token !== "null") {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const config = { method, headers };
      if (body) config.body = isFormData ? body : JSON.stringify(body);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      if (response.status === 204) return null;
      
      let data = null;
      try { data = await response.json(); } catch (_) { data = null; }
      if (data === null) {
        if (response.status === 401) { /* neeche wala 401 block handle karega */ }
        else throw new Error(response.ok ? "Invalid server response" : `Server temporarily unavailable (${response.status}). Please try again.`);
        data = {};
      }

      if (response.status === 401) {
        localStorage.removeItem("erp_token");
        if (authLogoutRef) authLogoutRef();       // React state se logout
        
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) throw new Error(data.message || data.error || "API Error");
      return data;
    } catch (error) {
      console.error(`Error on ${endpoint}:`, error.message);
      throw error;
    }
  };
