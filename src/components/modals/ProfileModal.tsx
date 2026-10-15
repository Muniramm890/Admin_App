// FILE: teacher-app/src/components/modals/ProfileModal.tsx
// Source: admin App.tsx -> ProfileModal [25401-25607]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { uploadToCloudinary } from "../../api/uploads";
import { FormGrid } from "../ui/FormGrid";
import { FormRow } from "../ui/FormRow";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { useDialog } from "../../contexts/DialogContext";
import { C } from "../../theme/theme";
import { ROLE_META } from "../../utils/roles";

export const ProfileModal = ({ open, onClose }) => {
  const { dialogAlert } = useDialog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    full_name: "", phone: "", date_of_birth: "", gender: "", avatar_url: "",
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPw, setSavingPw] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/auth/me");
      const data = res?.data || res;
      setProfile(data);
      setForm({
        full_name: data.full_name || "",
        phone: data.phone || "",
        date_of_birth: data.date_of_birth ? data.date_of_birth.split("T")[0] : "",
        gender: data.gender || "",
        avatar_url: data.avatar_url || "",
      });
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (open) loadProfile();
  }, [open]); // eslint-disable-line

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      setF("avatar_url", url);
    } catch (err) {
      dialogAlert("Photo upload failed. Please try again.", "Error");
    } finally { setUploadingPhoto(false); }
  };

  const handleSaveProfile = async () => {
    if (!form.full_name.trim()) {
      dialogAlert("Full name is required.", "Missing Info");
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequest("/auth/me", "PUT", {
        fullName: form.full_name.trim(),
        phone: form.phone || null,
        dateOfBirth: form.date_of_birth || null,
        gender: form.gender || null,
        avatarUrl: form.avatar_url || null,
      });
      const data = res?.data || res;
      setProfile(data);
      setForm({
        full_name: data.full_name || "",
        phone: data.phone || "",
        date_of_birth: data.date_of_birth ? data.date_of_birth.split("T")[0] : "",
        gender: data.gender || "",
        avatar_url: data.avatar_url || "",
      });
      await dialogAlert("Profile updated successfully!", "Success");
    } catch (e) {
      dialogAlert("Failed to update profile: " + e.message, "Error");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      dialogAlert("Please fill in both current and new password.", "Missing Info");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      dialogAlert("New password must be at least 6 characters.", "Too Short");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      dialogAlert("New passwords do not match.", "Mismatch");
      return;
    }
    setSavingPw(true);
    try {
      await apiRequest("/auth/change-password", "POST", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      await dialogAlert("Password changed successfully!", "Success");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      dialogAlert("Failed to change password: " + e.message, "Error");
    } finally { setSavingPw(false); }
  };

  const handleClose = () => {
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="My Profile" width={560}>
      {loading ? (
        <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 40, fontWeight: 600 }}>
          Loading your profile…
        </div>
      ) : (
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 16, padding: 16,
            background: C.surfaceAlt, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 20,
          }}>
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.primary}` }} />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: "50%", background: `${C.primary}22`, color: C.primary,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800,
              }}>
                {(form.full_name?.[0] || "?").toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <input
                type="file"
                id="profile-photo-upload"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              <label
                htmlFor="profile-photo-upload"
                className="btn btn-primary"
                style={{ cursor: uploadingPhoto ? "wait" : "pointer", fontSize: 12, padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {uploadingPhoto ? "Uploading…" : "📷 Change Photo"}
              </label>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                {profile?.email} · <span className="badge badge-blue" style={{ fontSize: 10 }}>{ROLE_META?.[profile?.role]?.label || profile?.role}</span>
              </div>
            </div>
          </div>

          <FormGrid cols={2}>
            <FormRow label="Full Name *">
              <input className="input" value={form.full_name} onChange={(e) => setF("full_name", e.target.value)} />
            </FormRow>
            <FormRow label="Phone">
              <input className="input" type="tel" value={form.phone} onChange={(e) => setF("phone", e.target.value)} />
            </FormRow>
          </FormGrid>
          <FormGrid cols={2}>
            <FormRow label="Date of Birth">
              <input className="input" type="date" value={form.date_of_birth} onChange={(e) => setF("date_of_birth", e.target.value)} />
            </FormRow>
            <FormRow label="Gender">
              <select className="select" value={form.gender} onChange={(e) => setF("gender", e.target.value)}>
                <option value="">-- Select --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </FormRow>
          </FormGrid>
          <FormRow label="Email (cannot be changed)">
            <input className="input" value={profile?.email || ""} disabled style={{ opacity: 0.6 }} />
          </FormRow>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 24, borderBottom: `1px solid ${C.border}33`, paddingBottom: 20 }}>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ minWidth: 160, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>

          <h4 className="syne" style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: C.primary }}>
            <Icon name="setup" size={14} /> Change Password
          </h4>
          <FormRow label="Current Password">
            <input className="input" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} />
          </FormRow>
          <FormGrid cols={2}>
            <FormRow label="New Password">
              <input className="input" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} />
            </FormRow>
            <FormRow label="Confirm New Password">
              <input className="input" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
            </FormRow>
          </FormGrid>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={handleChangePassword} disabled={savingPw} style={{ minWidth: 160 }}>
              {savingPw ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
