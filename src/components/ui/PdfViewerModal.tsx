// FILE: teacher-app/src/components/ui/PdfViewerModal.tsx
// Source: admin App.tsx -> PdfViewerModal [14646-14700]
// @ts-nocheck
import { useState } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { PAGE_SIZE_RATIOS } from "./helpers";
import { C } from "../../theme/theme";
import { isNative } from "../../native";
import { openDocument } from "../../utils/openDocument";
import { useDialog } from "../../contexts/DialogContext";

export const PdfViewerModal = ({ url, onClose, title = "Document Viewer", pageSize = "A4" }) => {
  const [downloading, setDownloading] = useState(false);
  const { dialogAlert } = useDialog();

  const ratio = PAGE_SIZE_RATIOS[pageSize] || PAGE_SIZE_RATIOS.A4;
  const maxViewportH = typeof window !== "undefined" ? window.innerHeight * 0.75 : 700;
  const aspectW = ratio.w / ratio.h;
  const viewerHeight = Math.min(maxViewportH, 780);
  const viewerWidth = viewerHeight * aspectW;

  const handleDownload = async () => {
    if (!url) return;
    setDownloading(true);
    if (isNative) { // Android app: download, then open in the phone's PDF viewer
      try { await openDocument({ url, name: (title || "Document") + ".pdf", mime: "application/pdf" }); }
      catch (e) { await dialogAlert(e?.message || "Could not open this file.", "Could not open file"); }
      finally { setDownloading(false); }
      return;
    }
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = url.split("/").pop() || "document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, "_blank"); // fallback only if fetch/CORS fails
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal open={!!url} onClose={onClose} title={title} width={Math.min(viewerWidth + 40, 900)}>
      <div style={{
        width: "100%", height: viewerHeight, background: C.surfaceAlt,
        borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`,
        display: "flex", justifyContent: "center", alignItems: "center",
      }}>
        {url && isNative && (
          <div style={{ textAlign: "center", padding: 24, color: C.textMuted, fontSize: 13 }}>
            <Icon name="file" size={34} />
            <div style={{ marginTop: 10 }}>Tap <b>Open PDF</b> to view this document in your phone's PDF viewer.</div>
          </div>
        )}
        {url && !isNative && (
          <iframe
            src={`${url}#toolbar=0&navpanes=0`}
            title={title}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={handleDownload} disabled={downloading} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="download" size={14} />
          {downloading ? "Opening…" : (isNative ? "Open PDF" : "Download PDF")}
        </button>
      </div>
    </Modal>
  );
};
