// FILE: teacher-app/src/modules/transport/TransportLiveTab.tsx
// @ts-nocheck
// Live fleet map (Google Maps). Positions come from the driver phones (24x7 tracking) and from Traccar devices.
// Status: Live (updated <= 2 min ago) · Last seen Xm/Xh/Xd (compact) · No data.
import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../api/client";
import { Icon } from "../../components/ui/Icon";
import { C } from "../../theme/theme";

const LIVE_SEC = 120, RECENT_SEC = 1800;
const COLORS = { live: "#22C55E", recent: "#F59E0B", offline: "#EF4444", none: "#94A3B8" };
const LABEL = { live: "Live", recent: "Recently", offline: "Offline", none: "No data" };

const ago = (s) => (s == null ? "No data" : s < 60 ? `${Math.max(0, Math.round(s))}s` : s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let gmapsPromise = null;
const loadGoogleMaps = (key) => {
  if (!gmapsPromise) {
    gmapsPromise = new Promise((resolve, reject) => {
      if (window.google?.maps) return resolve(window.google.maps);
      window.gm_authFailure = () => reject(new Error("Google Maps rejected the API key (check the key restrictions)."));
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
      s.async = true;
      s.onload = () => (window.google?.maps ? resolve(window.google.maps) : reject(new Error("Google Maps failed to load.")));
      s.onerror = () => reject(new Error("Could not load Google Maps. Check the internet connection."));
      document.head.appendChild(s);
    }).catch((e) => { gmapsPromise = null; throw e; });
  }
  return gmapsPromise;
};

const pinIcon = (maps, color, label) => ({
  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52"><path d="M22 51C22 51 41 33 41 20C41 9.5 32.5 1 22 1S3 9.5 3 20C3 33 22 51 22 51Z" fill="${color}" stroke="#fff" stroke-width="2.5"/><circle cx="22" cy="20" r="11.5" fill="#fff"/><text x="22" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${label.length > 3 ? 10 : 11.5}" fill="${color}">${esc(label)}</text></svg>`),
  scaledSize: new maps.Size(40, 47), anchor: new maps.Point(20, 47),
});

export const TransportLiveTab = () => {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapErr, setMapErr] = useState(null);
  const [mapKey, setMapKey] = useState(undefined); // undefined = loading, null = not configured
  const [sel, setSel] = useState(null);
  const [traffic, setTraffic] = useState(false);
  const [, force] = useState(0);
  const fetchedAt = useRef(Date.now());
  const mapDiv = useRef(null), map = useRef(null), mapsApi = useRef(null), markers = useRef({}), info = useRef(null), trafficLayer = useRef(null), fitted = useRef(false);
  const tickN = useRef(0);

  // data
  const load = async () => {
    try {
      if (tickN.current++ % 4 === 0) apiRequest("/transport/gps/live").catch(() => {}); // refresh Traccar-fed vehicles (ignored if not configured)
      const res = await apiRequest("/transport/fleet/live");
      fetchedAt.current = Date.now(); setFleet(res?.data || []); setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); const iv = setInterval(load, 10000); const t = setInterval(() => force((n) => n + 1), 15000); return () => { clearInterval(iv); clearInterval(t); }; }, []);
  useEffect(() => { apiRequest("/transport/map-config").then((r) => setMapKey(r?.data?.google_maps_key || null)).catch(() => setMapKey(null)); }, []);

  const vehicles = useMemo(() => {
    const extra = (Date.now() - fetchedAt.current) / 1000;
    return fleet.map((v) => {
      const age = v.age_sec == null || v.latitude == null ? null : v.age_sec + extra;
      const status = age == null ? "none" : age <= LIVE_SEC ? "live" : age <= RECENT_SEC ? "recent" : "offline";
      return { ...v, age, status, lat: v.latitude == null ? null : Number(v.latitude), lng: v.longitude == null ? null : Number(v.longitude) };
    }).sort((a, b) => ({ live: 0, recent: 1, offline: 2, none: 3 }[a.status] - { live: 0, recent: 1, offline: 2, none: 3 }[b.status]) || String(a.registration_no).localeCompare(String(b.registration_no)));
  }, [fleet, loading, error, fetchedAt.current]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => vehicles.reduce((m, v) => { m[v.status]++; return m; }, { live: 0, recent: 0, offline: 0, none: 0 }), [vehicles]);

  // map setup
  useEffect(() => {
    if (!mapKey || !mapDiv.current || map.current) return;
    let dead = false;
    loadGoogleMaps(mapKey).then((maps) => {
      if (dead || !mapDiv.current) return;
      mapsApi.current = maps;
      map.current = new maps.Map(mapDiv.current, { center: { lat: 22.5, lng: 78.9 }, zoom: 5, mapTypeControl: true, streetViewControl: false, fullscreenControl: true, gestureHandling: "greedy", clickableIcons: false });
      info.current = new maps.InfoWindow();
      force((n) => n + 1);
    }).catch((e) => setMapErr(e.message));
    return () => { dead = true; };
  }, [mapKey]);

  const infoHtml = (v) => `
    <div style="font-family:Inter,Arial,sans-serif;min-width:200px;color:#14151F">
      <div style="font-weight:800;font-size:15px">${esc(v.registration_no)} <span style="font-size:11px;font-weight:700;color:${COLORS[v.status]}">● ${v.status === "live" ? "Live" : v.status === "none" ? "No data" : "Last seen " + ago(v.age) + " ago"}</span></div>
      <div style="font-size:12.5px;margin-top:6px;line-height:1.6;color:#444">
        ${v.route_name ? "Route: <b>" + esc(v.route_name) + "</b><br/>" : ""}
        ${v.driver_name ? "Driver: <b>" + esc(v.driver_name) + "</b>" + (v.driver_phone ? ` · <a href="tel:${esc(v.driver_phone)}">${esc(v.driver_phone)}</a>` : "") + "<br/>" : ""}
        ${v.speed_kmh != null && v.status === "live" ? "Speed: <b>" + Math.round(v.speed_kmh) + " km/h</b><br/>" : ""}
        ${v.battery_pct != null ? "Phone battery: <b>" + v.battery_pct + "%</b><br/>" : ""}
      </div>
      <a href="https://www.google.com/maps?q=${v.lat},${v.lng}" target="_blank" rel="noopener noreferrer" style="font-size:12.5px;font-weight:700;color:#1a73e8">Open in Google Maps</a>
    </div>`;

  // markers follow the data
  useEffect(() => {
    const maps = mapsApi.current, m = map.current; if (!maps || !m) return;
    const seen = new Set(); const bounds = new maps.LatLngBounds();
    vehicles.forEach((v) => {
      if (v.lat == null) return;
      seen.add(v.vehicle_id); const pos = { lat: v.lat, lng: v.lng }; bounds.extend(pos);
      const label = String(v.registration_no || "").replace(/\s+/g, "").slice(-4);
      let mk = markers.current[v.vehicle_id];
      if (!mk) { mk = new maps.Marker({ map: m, position: pos, title: v.registration_no }); mk.addListener("click", () => setSel(v.vehicle_id)); markers.current[v.vehicle_id] = mk; }
      mk.setPosition(pos); mk.setIcon(pinIcon(maps, COLORS[v.status], label)); mk.setZIndex(v.status === "live" ? 3 : v.status === "recent" ? 2 : 1);
    });
    Object.keys(markers.current).forEach((id) => { if (!seen.has(id)) { markers.current[id].setMap(null); delete markers.current[id]; } });
    if (!fitted.current && seen.size) { fitted.current = true; m.fitBounds(bounds, 60); if (seen.size === 1) m.setZoom(15); }
  }, [vehicles, mapKey, mapsApi.current]);

  // selecting a vehicle -> focus + info window
  useEffect(() => {
    const maps = mapsApi.current, m = map.current; if (!maps || !m || !sel) return;
    const v = vehicles.find((x) => x.vehicle_id === sel); const mk = markers.current[sel]; if (!v || !mk) return;
    m.panTo({ lat: v.lat, lng: v.lng }); if ((m.getZoom() || 0) < 15) m.setZoom(16);
    info.current.setContent(infoHtml(v)); info.current.open({ map: m, anchor: mk });
  }, [sel, vehicles]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const maps = mapsApi.current, m = map.current; if (!maps || !m) return;
    if (!trafficLayer.current) trafficLayer.current = new maps.TrafficLayer();
    trafficLayer.current.setMap(traffic ? m : null);
  }, [traffic, mapKey, mapsApi.current]);

  const fitAll = () => {
    const maps = mapsApi.current, m = map.current; if (!maps || !m) return;
    const b = new maps.LatLngBounds(); let n = 0; vehicles.forEach((v) => { if (v.lat != null) { b.extend({ lat: v.lat, lng: v.lng }); n++; } });
    if (n) { m.fitBounds(b, 60); if (n === 1) m.setZoom(15); } setSel(null); info.current?.close();
  };

  return (
    <div>
      <style>{`
        .fleet-wrap { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 14px; height: calc(100vh - 250px); min-height: 520px; }
        .fleet-list { overflow-y: auto; padding: 0; }
        .fleet-map { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid ${C.border}; min-height: 360px; background: ${C.surfaceAlt}; }
        @media (max-width: 900px) { .fleet-wrap { grid-template-columns: 1fr; height: auto; } .fleet-map { height: 52vh; order: -1; } .fleet-list { max-height: 44vh; } }
        .fleet-row { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-bottom: 1px solid ${C.border}; cursor: pointer; }
        .fleet-row:hover { background: ${C.surfaceAlt}; }
      `}</style>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        {["live", "recent", "offline", "none"].map((k) => counts[k] > 0 && (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, padding: "5px 11px", borderRadius: 100, background: `${COLORS[k]}1F`, color: COLORS[k] }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: COLORS[k] }} />{counts[k]} {LABEL[k]}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={() => setTraffic((t) => !t)} style={traffic ? { borderColor: C.primary, color: C.primary } : null}>Traffic</button>
        <button className="btn btn-ghost" onClick={fitAll}>Show all</button>
        <button className="btn btn-ghost" onClick={load}><Icon name="refresh" size={13} /> Refresh</button>
      </div>

      {error && <div className="card" style={{ padding: 14, marginBottom: 12, borderColor: C.red }}><div style={{ color: C.red, fontSize: 12.5, fontWeight: 600 }}>{error}</div></div>}
      {(mapKey === null || mapErr) && (
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{mapErr ? "Map could not be shown" : "Google Maps is not set up yet"}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 3 }}>{mapErr || "Add the GOOGLE_MAPS_API_KEY setting on the server to see vehicles on the map. The list below still works."}</div>
        </div>
      )}

      <div className="fleet-wrap" style={mapKey ? null : { gridTemplateColumns: "1fr", height: "auto" }}>
        <div className="card fleet-list">
          {loading ? <div style={{ padding: 30, textAlign: "center", color: C.textMuted }}>Loading…</div>
            : !vehicles.length ? <div style={{ padding: 30, textAlign: "center", color: C.textMuted, fontSize: 13 }}>No vehicles yet. Add vehicles in the Vehicles tab.</div>
            : vehicles.map((v) => (
              <div key={v.vehicle_id} className="fleet-row" onClick={() => v.lat != null ? setSel(v.vehicle_id) : null} style={sel === v.vehicle_id ? { background: C.surfaceAlt } : null}>
                <span style={{ width: 11, height: 11, borderRadius: 6, background: COLORS[v.status], flexShrink: 0, boxShadow: v.status === "live" ? `0 0 0 4px ${COLORS.live}33` : "none" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{v.registration_no}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{[v.driver_name, v.route_name].filter(Boolean).join(" · ") || "No driver / route assigned"}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS[v.status] }}>{v.status === "live" ? (v.speed_kmh != null && Number(v.speed_kmh) >= 3 ? `${Math.round(v.speed_kmh)} km/h` : "Live") : v.status === "none" ? "No data" : `${ago(v.age)} ago`}</div>
                  {v.battery_pct != null && <div style={{ fontSize: 11, color: C.textMuted }}>🔋 {v.battery_pct}%</div>}
                </div>
              </div>
            ))}
        </div>
        {mapKey && <div className="fleet-map"><div ref={mapDiv} style={{ position: "absolute", inset: 0 }} />{!map.current && !mapErr && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 13 }}>Loading map…</div>}</div>}
      </div>
    </div>
  );
};
