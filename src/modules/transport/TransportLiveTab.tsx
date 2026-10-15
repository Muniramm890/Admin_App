// FILE: teacher-app/src/modules/transport/TransportLiveTab.tsx
// Source: admin App.tsx -> TransportLiveTab [9916-9974]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { Icon } from "../../components/ui/Icon";
import { useDialog } from "../../contexts/DialogContext";
import { C } from "../../theme/theme";

// ── LIVE TRACKING (self-hosted Traccar, per-school) ─────────────────────
export const TransportLiveTab = () => {
  const { dialogAlert } = useDialog();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { const res = await apiRequest("/transport/gps/live"); setPositions(res?.data || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.textMuted }}>Auto-refreshes every 15s from your school's Traccar server.</div>
        <button className="btn btn-ghost" onClick={load}><Icon name="refresh" size={13} /> Refresh</button>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, marginBottom: 14, borderColor: C.red }}>
          <div style={{ color: C.red, fontSize: 12.5, fontWeight: 600 }}>{error}</div>
          <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 4 }}>Set up your Traccar connection in the Settings tab.</div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Vehicle</th><th>Speed</th><th>Ignition</th><th>Last Update</th><th>Location</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Loading…</td></tr>
              ) : positions.length === 0 && !error ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>No live positions yet — check device IMEIs are correctly set on your vehicles.</td></tr>
              ) : positions.map((p) => (
                <tr key={p.vehicle_id}>
                  <td style={{ fontWeight: 700 }}>{p.registration_no}</td>
                  <td style={{ fontSize: 12 }}>{p.speed_kmh} km/h</td>
                  <td>{p.ignition_on ? <span className="badge badge-green">ON</span> : <span className="badge badge-red">OFF</span>}</td>
                  <td style={{ fontSize: 11.5, color: C.textMuted }}>{p.recorded_at ? new Date(p.recorded_at).toLocaleTimeString() : "—"}</td>
                  <td>
                    {p.latitude && p.longitude ? (
                      <a href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=16/${p.latitude}/${p.longitude}`} target="_blank" rel="noreferrer" style={{ color: C.primary, fontSize: 12, fontWeight: 600 }}>
                        View on Map ↗
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
