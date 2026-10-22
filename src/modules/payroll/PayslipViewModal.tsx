// FILE: teacher-app/src/modules/payroll/PayslipViewModal.tsx
// Source: admin App.tsx -> PayslipViewModal [15862-16029]
// @ts-nocheck
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { Icon } from "../../components/ui/Icon";
import { DocLink } from "../../components/ui/DocLink";
import { openPdf } from "../../utils/openDocument";
import { inr, monthLabel } from "./helpers";
import { C } from "../../theme/theme";

// ═══════════════════════════════════════════════════════════════
// PAYSLIP VIEW / PRINT — mirrors the app's existing A4 print pattern
// ═══════════════════════════════════════════════════════════════
export const PayslipViewModal = ({ slipId, open, onClose, school }) => {
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !slipId) return;
    setLoading(true);
    apiRequest(`/payroll/payslips/${slipId}`).then((res) => setSlip(res.data)).finally(() => setLoading(false));
  }, [open, slipId]);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const res = await apiRequest(`/payroll/payslips/${slipId}/generate-pdf`, "POST");
      setPdfUrl(res.data.pdf_url);
      openPdf({ url: res.data.pdf_url, name: "Payslip.pdf", mime: "application/pdf", title: `Payslip${slip?.staff_name ? " • " + slip.staff_name : ""}` });
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Payslip_${slip?.staff_name?.replace(/\s+/g, "_")}_${slip?.month_year}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
  };

  if (!open) return null;

  return (
    <div className="slide-in" style={{ position: "fixed", inset: 0, zIndex: 9999, background: C.bg, display: "flex", flexDirection: "column" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #payslip-print-zone, #payslip-print-zone * { visibility: visible; }
          #payslip-print-zone { position: absolute !important; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; }
          @page { size: A4 portrait; margin: 12mm; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ padding: "12px 24px", background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="close" size={16} /> Close</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleGeneratePdf} disabled={generatingPdf} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="file" size={15} /> {generatingPdf ? "Generating..." : "Generate PDF"}
          </button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="print" size={15} /> Print</button>
        </div>
      </div>

      {pdfUrl && (
        <div className="no-print" style={{ background: "#26282f", padding: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#fff", fontSize: 12 }}>PDF ready:</span>
          <button onClick={() => openPdf({ url: pdfUrl, name: "Payslip.pdf", mime: "application/pdf", title: "Payslip" })} style={{ color: "#8ab4ff", fontSize: 12, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 6 }}>Open PDF</button>
          <DocLink doc={{ url: pdfUrl, name: "Payslip.pdf", mime: "application/pdf" }} forceDownload style={{ color: "#8ab4ff", fontSize: 12, fontWeight: 700, padding: 6 }}>Download</DocLink>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {loading || !slip ? (
          <div style={{ padding: 60, color: C.textMuted }}>Loading payslip...</div>
        ) : (
          <div id="payslip-print-zone" style={{ background: "#fff", width: 720, maxWidth: "100%", padding: 28, border: "1px solid #000", position: "relative", overflow: "hidden" }}>

          {/* Watermark — centered, low opacity, behind all content */}
          {(school?.watermark_url || school?.logo_url) && (
            <img src={school.watermark_url || school.logo_url} alt=""
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 300, height: 300, objectFit: "contain", opacity: 0.06, pointerEvents: "none", zIndex: 0 }} />
          )}

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${school?.brand_color || "#1a1a2e"}`, paddingBottom: 10, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {school?.logo_url && <img src={school.logo_url} alt="" style={{ width: 42, height: 42, objectFit: "contain", flexShrink: 0 }} />}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>{school?.name}</div>
                  {school?.tagline && <div style={{ fontSize: 9, fontStyle: "italic", color: "#777", marginTop: 1 }}>{school.tagline}</div>}
                  <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>{[school?.address_line1, school?.city, school?.state, school?.pincode].filter(Boolean).join(", ")}</div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: school?.brand_color || "#1a1a2e", letterSpacing: "0.5px" }}>SALARY SLIP</div>
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>{monthLabel(slip.month_year)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 12.5, marginBottom: 20, borderBottom: "1px solid #ccc", paddingBottom: 16 }}>
              <div><b>Employee:</b> {slip.staff_name}</div>
              <div><b>Designation:</b> {slip.designation || "—"}</div>
              <div><b>Department:</b> {slip.department || "—"}</div>
              <div><b>Payment Status:</b> {slip.payment_status}</div>
              <div><b>Present Days:</b> {slip.present_days} / {slip.total_days}</div>
              <div><b>Paid Leave:</b> {slip.paid_leave_days} &nbsp; <b>LOP:</b> {slip.lop_days}</div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ textAlign: "left", padding: 8, border: "1px solid #ccc" }}>Earnings</th>
                  <th style={{ textAlign: "right", padding: 8, border: "1px solid #ccc" }}>Amount</th>
                  <th style={{ textAlign: "left", padding: 8, border: "1px solid #ccc" }}>Deductions</th>
                  <th style={{ textAlign: "right", padding: 8, border: "1px solid #ccc" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Basic Pay", slip.basic, "LOP Deduction", slip.lop_deduction],
                  ["HRA", slip.hra, "PF", slip.pf_deduction],
                  ["DA", slip.da, "PT", slip.pt_deduction],
                  ["Special Allowance", slip.special_allowance, "Other", slip.other_deduction],
                  ["Other Allowance", slip.other_allowance, "", ""],
                ].map(([el, ea, dl, da2], i) => (
                  <tr key={i}>
                    <td style={{ padding: 8, border: "1px solid #ccc" }}>{el}</td>
                    <td style={{ padding: 8, border: "1px solid #ccc", textAlign: "right" }}>{inr(ea)}</td>
                    <td style={{ padding: 8, border: "1px solid #ccc" }}>{dl}</td>
                    <td style={{ padding: 8, border: "1px solid #ccc", textAlign: "right" }}>{da2 !== "" ? inr(da2) : ""}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 800, background: "#fafafa" }}>
                  <td style={{ padding: 8, border: "1px solid #ccc" }}>Gross Total</td>
                  <td style={{ padding: 8, border: "1px solid #ccc", textAlign: "right" }}>{inr(slip.gross_salary)}</td>
                  <td style={{ padding: 8, border: "1px solid #ccc" }}>Total Deductions</td>
                  <td style={{ padding: 8, border: "1px solid #ccc", textAlign: "right" }}>{inr(slip.total_deduction)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <div style={{ border: "2px solid #000", padding: "10px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700 }}>NET PAY</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{inr(slip.net_pay)}</div>
              </div>
            </div>

            {slip.is_manually_adjusted && (
              <div style={{ background: "#FFF8E1", border: "1px solid #F0C929", borderRadius: 6, padding: 10, marginBottom: 16, fontSize: 11.5 }}>
                <b>Note:</b> This payslip includes a manual adjustment. {slip.bonus_amount > 0 ? `Bonus: ${inr(slip.bonus_amount)}. ` : ""}
                Reason: {slip.adjustment_note}
              </div>
            )}
            {slip.bank_details && (
              <div style={{ fontSize: 11.5, color: "#555", borderTop: "1px solid #ccc", paddingTop: 12 }}>
                Paid to: {slip.bank_details.bank_name || "—"} • A/C: {slip.bank_details.account_number ? "••••" + String(slip.bank_details.account_number).slice(-4) : "—"}
                {slip.bank_details.upi_id ? ` • UPI: ${slip.bank_details.upi_id}` : ""}
                {slip.trx_id ? ` • Txn Ref: ${slip.trx_id}` : ""}
              </div>
            )}

             <div style={{ fontSize: 9, color: "#999", textAlign: "center", marginTop: 18 }}>This is a system-generated payslip and does not require a signature.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
