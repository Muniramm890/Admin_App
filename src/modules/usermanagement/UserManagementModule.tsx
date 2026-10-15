// FILE: teacher-app/src/modules/usermanagement/UserManagementModule.tsx
// Source: admin App.tsx -> UserManagementModule [22451-23087]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { FormRow } from "../../components/ui/FormRow";
import { Icon } from "../../components/ui/Icon";
import { KpiCard } from "../../components/ui/KpiCard";
import { Modal } from "../../components/ui/Modal";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { useDialog } from "../../contexts/DialogContext";
import { PERMISSION_MODULES } from "./helpers";
import { C } from "../../theme/theme";
import { ROLE_META } from "../../utils/roles";

export const UserManagementModule = () => {
  const { dialogAlert, dialogConfirm } = useDialog();
  const [mode, setMode] = useState("staff"); // 'staff' | 'students'

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [studentsOverview, setStudentsOverview] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudentsList, setLoadingStudentsList] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterGrade, setStudentFilterGrade] = useState("");
  const [studentFilterStatus, setStudentFilterStatus] = useState("");
  const [studentGrades, setStudentGrades] = useState([]);
  const [authorizeModal, setAuthorizeModal] = useState(null); // student row being authorized
  const [authIdentifierType, setAuthIdentifierType] = useState("phone");
  const [authIdentifierValue, setAuthIdentifierValue] = useState("");
  const [authPwMode, setAuthPwMode] = useState("auto");
  const [authPwValue, setAuthPwValue] = useState("");
  const [authResult, setAuthResult] = useState(null);
  const [savingAuth, setSavingAuth] = useState(false);
  const [studentPwModal, setStudentPwModal] = useState(null);
  const [studentPwMode, setStudentPwMode] = useState("auto");
  const [studentPwValue, setStudentPwValue] = useState("");
  const [studentPwResult, setStudentPwResult] = useState(null);
  const [savingStudentPw, setSavingStudentPw] = useState(false);

  const [permModal, setPermModal] = useState(null);
  const [permSelected, setPermSelected] = useState(new Set());
  const [savingPerm, setSavingPerm] = useState(false);

  const [pwModal, setPwModal] = useState(null);
  const [pwMode, setPwMode] = useState("auto");
  const [pwValue, setPwValue] = useState("");
  const [pwResult, setPwResult] = useState(null);
  const [savingPw, setSavingPw] = useState(false);
  const [emailModal, setEmailModal] = useState(null);
  const [emailValue, setEmailValue] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [roleModal, setRoleModal] = useState(null);
  const [roleValue, setRoleValue] = useState("teacher");
  const [savingRole, setSavingRole] = useState(false);



  useEffect(() => { loadStaff(); loadStudentsOverview(); }, []);

  useEffect(() => {
    apiRequest("/setup/grades").then((r) => setStudentGrades(r?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === "students") loadStudentsForAuth();
  }, [mode, studentSearch, studentFilterGrade, studentFilterStatus]); 

  const filtered = staff.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
    const matchRole = !filterRole || s.role === filterRole;
    const matchStatus = filterStatus === "active" ? s.is_active : filterStatus === "blocked" ? !s.is_active : true;
    return matchSearch && matchRole && matchStatus;
  });

  const kpi = {
    total: staff.length,
    active: staff.filter((s) => s.is_active).length,
    blocked: staff.filter((s) => !s.is_active).length,
    admins: staff.filter((s) => s.role === "school_admin").length,
  };

  const loadStudentsForAuth = async () => {
    setLoadingStudentsList(true);
    try {
      const params = new URLSearchParams({
        search: studentSearch || "",
        grade_id: studentFilterGrade || "",
        status: studentFilterStatus || "",
      });
      const res = await apiRequest(`/admin/users/students?${params.toString()}`);
      setStudentsList(Array.isArray(res?.data) ? res.data : []);
    } catch (e) { console.error(e); } finally { setLoadingStudentsList(false); }
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/admin/users/staff");
      setStaff(Array.isArray(res?.data) ? res.data : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadStudentsOverview = async () => {
    setLoadingStudents(true);
    try {
      const res = await apiRequest("/admin/users/students-overview");
      setStudentsOverview(res?.data || null);
    } catch (e) { console.error(e); } finally { setLoadingStudents(false); }
  };

  const openAuthorizeModal = (student) => {
    setAuthorizeModal(student);
    setAuthIdentifierType("phone");
    setAuthIdentifierValue(student.guardian_phone || "");
    setAuthPwMode("auto");
    setAuthPwValue("");
    setAuthResult(null);
  };

  const handleAuthorize = async () => {
    if (!authorizeModal) return;
    if (!authIdentifierValue.trim()) return dialogAlert("Enter a value for the selected login ID type.", "Missing Info");
    setSavingAuth(true);
    try {
      const res = await apiRequest(`/admin/users/students/${authorizeModal.student_id}/authorize`, "POST", {
        identifier_type: authIdentifierType,
        identifier_value: authIdentifierValue.trim(),
        newPassword: undefined,
        password: authPwMode === "custom" ? authPwValue.trim() : undefined,
      });
      setAuthResult(res?.data?.temporaryPassword || (authPwMode === "custom" ? authPwValue.trim() : null));
      await loadStudentsForAuth();
      await loadStudentsOverview();
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); } finally { setSavingAuth(false); }
  };

  const handleToggleStudentLogin = async (row) => {
    const nextActive = row.login_status !== "active";
    const msg = nextActive ? `Unblock login for ${row.first_name}?` : `Block login for ${row.first_name}? They'll be logged out immediately.`;
    if (!(await dialogConfirm(msg, nextActive ? "Unblock Login" : "Block Login"))) return;
    try {
      await apiRequest(`/admin/users/students/${row.student_id}/status`, "PUT", { is_active: nextActive });
      await loadStudentsForAuth();
      await loadStudentsOverview();
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
  };

  const openStudentPwModal = (row) => {
    setStudentPwModal(row); setStudentPwMode("auto"); setStudentPwValue(""); setStudentPwResult(null);
  };

  const handleResetStudentPw = async () => {
    if (!studentPwModal) return;
    if (studentPwMode === "custom" && studentPwValue.trim().length < 6) {
      return dialogAlert("Password must be at least 6 characters.", "Too Short");
    }
    setSavingStudentPw(true);
    try {
      const res = await apiRequest(`/admin/users/students/${studentPwModal.student_id}/reset-password`, "POST", {
        newPassword: studentPwMode === "custom" ? studentPwValue.trim() : undefined,
      });
      setStudentPwResult(res?.data?.temporaryPassword || (studentPwMode === "custom" ? studentPwValue.trim() : null));
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); } finally { setSavingStudentPw(false); }
  };

  const handleToggleBlock = async (row) => {
    const nextActive = !row.is_active;
    const confirmMsg = nextActive
      ? `Unblock ${row.full_name}? They will be able to log in again.`
      : `Block ${row.full_name}? They will be logged out and unable to access the system.`;
    if (!(await dialogConfirm(confirmMsg, nextActive ? "Unblock User" : "Block User"))) return;
    try {
      await apiRequest(`/admin/users/${row.member_id}/status`, "PUT", { is_active: nextActive });
      await loadStaff();
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
  };

  const openRoleModal = (row) => { setRoleValue(row.role); setRoleModal(row); };

  const handleSaveRole = async () => {
    if (!roleModal) return;
    if (roleValue === "school_admin" && roleModal.role !== "school_admin") {
      const ok = await dialogConfirm(
        `Make ${roleModal.full_name} a Super Admin? They will get full access to everything, including User Management.`,
        "Confirm Promotion"
      );
      if (!ok) return;
    }
    setSavingRole(true);
    try {
      await apiRequest(`/admin/users/${roleModal.member_id}/role`, "PUT", { role: roleValue });
      setRoleModal(null);
      await loadStaff();
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); } finally { setSavingRole(false); }
  };

  const openPermModal = (row) => {
    setPermSelected(new Set(row.permissions?.modules || []));
    setPermModal(row);
  };

  const togglePermModule = (id) => {
    setPermSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSavePerm = async () => {
    if (!permModal) return;
    setSavingPerm(true);
    try {
      await apiRequest(`/admin/users/${permModal.member_id}/permissions`, "PUT", { modules: Array.from(permSelected) });
      setPermModal(null);
      await loadStaff();
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); } finally { setSavingPerm(false); }
  };

  const openPwModal = (row) => { setPwMode("auto"); setPwValue(""); setPwResult(null); setPwModal(row); };
  const openEmailModal = (row) => { setEmailValue(row.email || ""); setEmailModal(row); };

  const handleUpdateEmail = async () => {
    if (!emailModal) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim())) {
      dialogAlert("Enter a valid email address.", "Invalid Email");
      return;
    }
    const ok = await dialogConfirm(`Change login email for ${emailModal.full_name} to "${emailValue.trim()}"? They will need to use this new email to log in.`, "Confirm Email Change");
    if (!ok) return;
    setSavingEmail(true);
    try {
      await apiRequest(`/admin/users/${emailModal.member_id}/email`, "PUT", { newEmail: emailValue.trim() });
      setEmailModal(null);
      await loadStaff();
      dialogAlert("Email updated successfully.", "Done");
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); } finally { setSavingEmail(false); }
  };

  const handleResetPw = async () => {
    if (!pwModal) return;
    if (pwMode === "custom" && pwValue.trim().length < 6) {
      dialogAlert("Password must be at least 6 characters.", "Too Short");
      return;
    }
    setSavingPw(true);
    try {
      const res = await apiRequest(`/admin/users/${pwModal.member_id}/reset-password`, "POST", {
        newPassword: pwMode === "custom" ? pwValue.trim() : undefined,
      });
      setPwResult(res?.data?.temporaryPassword || (pwMode === "custom" ? pwValue.trim() : null));
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); } finally { setSavingPw(false); }
  };

  return (
    <div className="slide-in">
      <SectionHeader
        title="User Management"
        sub="Super Admin only — manage every staff account, access level, and login credentials"
        action={
          <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {[{ id: "staff", label: "Staff", icon: "teachers" }, { id: "students", label: "Students", icon: "students" }].map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "none", cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13,
                background: mode === m.id ? C.primary : "transparent", color: mode === m.id ? "white" : C.textMuted,
              }}>
                <Icon name={m.icon} size={14} /> {m.label}
              </button>
            ))}
          </div>
        }
      />

      {mode === "staff" ? (
        <>
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
            <KpiCard label="Total Staff" value={loading ? "—" : kpi.total} icon="teachers" color={C.blue} />
            <KpiCard label="Active" value={loading ? "—" : kpi.active} icon="check" color={C.green} />
            <KpiCard label="Blocked" value={loading ? "—" : kpi.blocked} icon="warning" color={C.red} />
            <KpiCard label="Super Admins" value={loading ? "—" : kpi.admins} icon="setup" color={C.primary} />
          </div>

          <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Icon name="search" size={14} color={C.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input className="input" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
              </div>
              <select className="select" style={{ width: 160 }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="">All Roles</option>
                {Object.entries(ROLE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="select" style={{ width: 140 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <button className="btn btn-ghost" onClick={loadStaff} style={{ padding: "8px 10px" }}><Icon name="attendance" size={14} /></button>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{filtered.length} found</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {loading ? (
              <div className="pulse" style={{ padding: 50, textAlign: "center", color: C.primary, fontWeight: 600 }}>Loading staff accounts…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 50, textAlign: "center", color: C.textMuted }}>No staff found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr><th>Staff</th><th>Role</th><th>Access</th><th>Status</th><th>Last Login</th><th style={{ textAlign: "center" }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const rMeta = ROLE_META[s.role] || { label: s.role, color: C.textMuted };
                      const modCount = s.permissions?.modules?.length || 0;
                      return (
                        <tr key={s.member_id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {s.avatar_url ? (
                                <img src={s.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${rMeta.color}33`, color: rMeta.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                                  {(s.full_name?.[0] || "?").toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.full_name}{s.is_self && <span style={{ color: C.textMuted, fontWeight: 500 }}> (You)</span>}</div>
                                <div style={{ fontSize: 11, color: C.textMuted }}>{s.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge" style={{ background: `${rMeta.color}22`, color: rMeta.color }}>{rMeta.label}</span></td>
                          <td>
                            {s.role === "school_admin" ? (
                              <span style={{ fontSize: 12, color: C.textMuted }}>Full access</span>
                            ) : modCount === 0 ? (
                              <span style={{ fontSize: 12, color: C.yellow }}>No modules set</span>
                            ) : (
                              <span style={{ fontSize: 12, color: C.text }}>{modCount} module{modCount !== 1 ? "s" : ""}</span>
                            )}
                          </td>
                          <td><span className={`badge ${s.is_active ? "badge-green" : "badge-red"}`}>{s.is_active ? "Active" : "Blocked"}</span></td>
                          <td style={{ fontSize: 12, color: C.textMuted }}>{s.last_login_at ? new Date(s.last_login_at).toLocaleDateString("en-IN") : "Never"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                              <button className="btn btn-ghost" style={{ padding: "5px 9px" }} title="Change Role" onClick={() => openRoleModal(s)} disabled={s.is_self}><Icon name="setup" size={13} /></button>
                              <button className="btn btn-ghost" style={{ padding: "5px 9px" }} title="Module Access" onClick={() => openPermModal(s)} disabled={s.role === "school_admin"}><Icon name="eye" size={13} /></button>
                               <button className="btn btn-ghost" style={{ padding: "5px 9px" }} title="Reset Password" onClick={() => openPwModal(s)}><Icon name="edit" size={13} /></button>
                              <button className="btn btn-ghost" style={{ padding: "5px 9px" }} title="Change Email" onClick={() => openEmailModal(s)}><Icon name="user" size={13} /></button>
                              {s.is_active ? (
                                <button className="btn btn-danger" style={{ padding: "5px 9px" }} title="Block" onClick={() => handleToggleBlock(s)} disabled={s.is_self}><Icon name="warning" size={13} /></button>
                              ) : (
                                <button className="btn btn-success" style={{ padding: "5px 9px" }} title="Unblock" onClick={() => handleToggleBlock(s)}><Icon name="check" size={13} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
            ) : (
              <div>
                <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
                  <KpiCard label="Total Students" value={loadingStudents ? "—" : studentsOverview?.total || 0} icon="students" color={C.blue} />
                  <KpiCard label="Active" value={loadingStudents ? "—" : studentsOverview?.active || 0} icon="check" color={C.green} />
                  <KpiCard label="Login Enabled" value={loadingStudents ? "—" : studentsOverview?.login_enabled || 0} icon="setup" color={C.primary} />
                </div>
      
                <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                      <Icon name="search" size={14} color={C.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      <input className="input" placeholder="Search by name or admission no…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} style={{ paddingLeft: 32 }} />
                    </div>
                    <select className="select" style={{ width: 160 }} value={studentFilterGrade} onChange={(e) => setStudentFilterGrade(e.target.value)}>
                      <option value="">All Classes</option>
                      {studentGrades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <select className="select" style={{ width: 160 }} value={studentFilterStatus} onChange={(e) => setStudentFilterStatus(e.target.value)}>
                      <option value="">All Status</option>
                      <option value="authorized">Authorized</option>
                      <option value="blocked">Blocked</option>
                      <option value="not_authorized">Not Authorized</option>
                    </select>
                  </div>
                </div>
      
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {loadingStudentsList ? (
                    <div className="pulse" style={{ padding: 50, textAlign: "center", color: C.primary, fontWeight: 600 }}>Loading students…</div>
                  ) : studentsList.length === 0 ? (
                    <div style={{ padding: 50, textAlign: "center", color: C.textMuted }}>No students found.</div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="table">
                        <thead>
                          <tr><th>Student</th><th>Class</th><th>Login ID</th><th>Status</th><th>Last Login</th><th style={{ textAlign: "center" }}>Actions</th></tr>
                        </thead>
                        <tbody>
                          {studentsList.map((s) => (
                            <tr key={s.student_id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {s.photo_url ? (
                                    <img src={s.photo_url} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                                  ) : (
                                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${C.blue}33`, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                                      {(s.first_name?.[0] || "?").toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.first_name} {s.last_name}</div>
                                    <div style={{ fontSize: 11, color: C.textMuted }}>Adm# {s.admission_no}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: 12 }}>{s.class_name} {s.section_name} {s.roll_no ? `· Roll ${s.roll_no}` : ""}</td>
                              <td style={{ fontSize: 12 }}>
                                {s.login_status === "not_authorized" ? "—" : (
                                  <span>
                                    {s.login_phone || s.login_email || s.login_identifier}
                                    <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 9 }}>{s.identifier_type}</span>
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${s.login_status === "active" ? "badge-green" : s.login_status === "blocked" ? "badge-red" : "badge-yellow"}`}>
                                  {s.login_status === "active" ? "Authorized" : s.login_status === "blocked" ? "Blocked" : "Not Authorized"}
                                </span>
                              </td>
                              <td style={{ fontSize: 12, color: C.textMuted }}>{s.last_login_at ? new Date(s.last_login_at).toLocaleDateString("en-IN") : "Never"}</td>
                              <td>
                                <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                                  {s.login_status === "not_authorized" ? (
                                    <button className="btn btn-primary" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => openAuthorizeModal(s)}>Authorize</button>
                                  ) : (
                                    <>
                                      <button className="btn btn-ghost" style={{ padding: "5px 9px" }} title="Reset Password" onClick={() => openStudentPwModal(s)}><Icon name="edit" size={13} /></button>
                                      {s.login_status === "active" ? (
                                        <button className="btn btn-danger" style={{ padding: "5px 9px" }} title="Block" onClick={() => handleToggleStudentLogin(s)}><Icon name="warning" size={13} /></button>
                                      ) : (
                                        <button className="btn btn-success" style={{ padding: "5px 9px" }} title="Unblock" onClick={() => handleToggleStudentLogin(s)}><Icon name="check" size={13} /></button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

      <Modal open={!!roleModal} onClose={() => setRoleModal(null)} title="Change Role" width={420}>
        {roleModal && (
          <div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Changing role for <b style={{ color: C.text }}>{roleModal.full_name}</b></div>
            <FormRow label="Role">
              <select className="select" value={roleValue} onChange={(e) => setRoleValue(e.target.value)}>
                {Object.entries(ROLE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormRow>
            {roleValue === "school_admin" && (
              <div style={{ padding: 12, background: `${C.primary}11`, border: `1px solid ${C.primary}33`, borderRadius: 10, fontSize: 12, color: C.primary, marginBottom: 8 }}>
                ⚠ Super Admins get full, unrestricted access to every module including User Management.
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setRoleModal(null)} disabled={savingRole}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRole} disabled={savingRole}>{savingRole ? "Saving…" : "Save Role"}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!permModal} onClose={() => setPermModal(null)} title="Module Access" width={480}>
        {permModal && (
          <div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
              Choose which modules <b style={{ color: C.text }}>{permModal.full_name}</b> can access. Changes apply on their next login.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {PERMISSION_MODULES.map((m) => {
                const checked = permSelected.has(m.id);
                return (
                  <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, cursor: "pointer", border: `1.5px solid ${checked ? C.primary : C.border}`, background: checked ? `${C.primary}11` : C.surfaceAlt }}>
                    <input type="checkbox" checked={checked} onChange={() => togglePermModule(m.id)} style={{ width: 15, height: 15, accentColor: C.primary }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: checked ? C.primary : C.text }}>{m.label}</span>
                  </label>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setPermModal(null)} disabled={savingPerm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSavePerm} disabled={savingPerm}>{savingPerm ? "Saving…" : "Save Access"}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!pwModal} onClose={() => setPwModal(null)} title="Reset Password" width={420}>
        {pwModal && (
          pwResult ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>Password reset for <b style={{ color: C.text }}>{pwModal.full_name}</b>. Share this with them securely:</div>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: C.primary, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>{pwResult}</div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setPwModal(null)}>Done</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Resetting password for <b style={{ color: C.text }}>{pwModal.full_name}</b></div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[["auto", "Auto-generate"], ["custom", "Set custom"]].map(([v, l]) => (
                  <button key={v} onClick={() => setPwMode(v)} style={{ flex: 1, padding: "9px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12.5, border: `1.5px solid ${pwMode === v ? C.primary : C.border}`, background: pwMode === v ? `${C.primary}22` : C.surfaceAlt, color: pwMode === v ? C.primary : C.textMuted }}>{l}</button>
                ))}
              </div>
              {pwMode === "custom" && (
                <FormRow label="New Password">
                  <input className="input" type="text" value={pwValue} onChange={(e) => setPwValue(e.target.value)} placeholder="Minimum 6 characters" />
                </FormRow>
              )}
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setPwModal(null)} disabled={savingPw}>Cancel</button>
                <button className="btn btn-primary" onClick={handleResetPw} disabled={savingPw}>{savingPw ? "Resetting…" : "Reset Password"}</button>
              </div>
            </div>
          )
        )}
      </Modal>

      <Modal open={!!emailModal} onClose={() => setEmailModal(null)} title="Change Login Email" width={420}>
        {emailModal && (
          <div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
              Changing login email for <b style={{ color: C.text }}>{emailModal.full_name}</b>
            </div>
            <FormRow label="New Email">
              <input className="input" type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} placeholder="name@example.com" />
            </FormRow>
            <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 4, marginBottom: 8 }}>
              This changes their login username directly — no OTP verification. Change is recorded in the audit log.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setEmailModal(null)} disabled={savingEmail}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateEmail} disabled={savingEmail}>{savingEmail ? "Saving…" : "Update Email"}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!authorizeModal} onClose={() => setAuthorizeModal(null)} title="Authorize Student Login" width={440}>        {authorizeModal && (
          authResult !== null ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>Login enabled for <b style={{ color: C.text }}>{authorizeModal.first_name}</b>. Share these securely:</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Login ID: <b style={{ color: C.text }}>{authIdentifierValue}</b></div>
              {authResult && <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: C.primary, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginTop: 8, marginBottom: 16 }}>{authResult}</div>}
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setAuthorizeModal(null)}>Done</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Choose how <b style={{ color: C.text }}>{authorizeModal.first_name}</b> will log in to the Student App.</div>
              <FormRow label="Login ID Type">
                <select className="select" value={authIdentifierType} onChange={(e) => {
                  const t = e.target.value; setAuthIdentifierType(t);
                  setAuthIdentifierValue(t === "phone" ? (authorizeModal.guardian_phone || "") : t === "admission_no" ? authorizeModal.admission_no || "" : t === "roll_no" ? authorizeModal.roll_no || "" : "");
                }}>
                  <option value="phone">Phone Number</option>
                  <option value="admission_no">Admission Number</option>
                  <option value="roll_no">Roll Number</option>
                  <option value="email">Email</option>
                </select>
              </FormRow>
              <FormRow label="Value">
                <input className="input" value={authIdentifierValue} onChange={(e) => setAuthIdentifierValue(e.target.value)} />
              </FormRow>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, marginTop: 4 }}>
                {[["auto", "Auto-generate"], ["custom", "Set custom"]].map(([v, l]) => (
                  <button key={v} onClick={() => setAuthPwMode(v)} style={{ flex: 1, padding: "9px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12.5, border: `1.5px solid ${authPwMode === v ? C.primary : C.border}`, background: authPwMode === v ? `${C.primary}22` : C.surfaceAlt, color: authPwMode === v ? C.primary : C.textMuted }}>{l}</button>
                ))}
              </div>
              {authPwMode === "custom" && (
                <FormRow label="Password">
                  <input className="input" type="text" value={authPwValue} onChange={(e) => setAuthPwValue(e.target.value)} placeholder="Minimum 6 characters" />
                </FormRow>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setAuthorizeModal(null)} disabled={savingAuth}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAuthorize} disabled={savingAuth}>{savingAuth ? "Authorizing…" : "Authorize Login"}</button>
              </div>
            </div>
          )
        )}
      </Modal>

      <Modal open={!!studentPwModal} onClose={() => setStudentPwModal(null)} title="Reset Student Password" width={420}>
        {studentPwModal && (
          studentPwResult !== null ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>Password reset for <b style={{ color: C.text }}>{studentPwModal.first_name}</b>. Share this securely:</div>
              {studentPwResult && <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: C.primary, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>{studentPwResult}</div>}
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setStudentPwModal(null)}>Done</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Resetting password for <b style={{ color: C.text }}>{studentPwModal.first_name}</b></div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[["auto", "Auto-generate"], ["custom", "Set custom"]].map(([v, l]) => (
                  <button key={v} onClick={() => setStudentPwMode(v)} style={{ flex: 1, padding: "9px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12.5, border: `1.5px solid ${studentPwMode === v ? C.primary : C.border}`, background: studentPwMode === v ? `${C.primary}22` : C.surfaceAlt, color: studentPwMode === v ? C.primary : C.textMuted }}>{l}</button>
                ))}
              </div>
              {studentPwMode === "custom" && (
                <FormRow label="New Password">
                  <input className="input" type="text" value={studentPwValue} onChange={(e) => setStudentPwValue(e.target.value)} placeholder="Minimum 6 characters" />
                </FormRow>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setStudentPwModal(null)} disabled={savingStudentPw}>Cancel</button>
                <button className="btn btn-primary" onClick={handleResetStudentPw} disabled={savingStudentPw}>{savingStudentPw ? "Resetting…" : "Reset Password"}</button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};
