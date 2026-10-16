// FILE: teacher-app/src/api/client.ts
// Source: admin App.tsx -> API_BASE_URL + apiRequest (same backend, same token key 'erp_token')
// @ts-nocheck

export const API_BASE_URL =
  "https://waapi-h6e7b5g9cmfthkhn.centralindia-01.azurewebsites.net/api"; // 🔴 YAHAN APNI AZURE WEB APP KI LINK DAALEIN

  let authLogoutRef = null; // module-level, AuthProvider isko set karega
export const setAuthLogoutRef = (fn) => { authLogoutRef = fn; }; // [teacher-app] ES module me imported binding assign nahi hoti, isliye setter

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
      // Azure cold-start / 502 / 503 par HTML aata hai -> response.json() "Unexpected token <" se phat jata tha
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
        // 🔴 window.location.reload() fallback HATA DIYA — ye hi reload-loop
        // ka source tha. Ab error throw hoga, jo AuthProvider ke apne
        // try/catch mein already handle ho raha hai (token clear + setUser(null)
        // + setLoading(false)) — koi hard page-reload ki zaroorat nahi.
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) throw new Error(data.message || data.error || "API Error");
      return data;
    } catch (error) {
      console.error(`Error on ${endpoint}:`, error.message);
      throw error;
    }
  };
