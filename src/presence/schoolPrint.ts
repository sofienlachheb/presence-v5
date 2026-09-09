import schoolLogo from "../assets/school-logo.png";

// A repeating table header stays inside the printable area on every sheet.
export function writeSchoolPrint(target: Window, html: string) {
  const logoUrl = new URL(schoolLogo, window.location.href).href;
  const styles = `<style>
    table.school-print-layout { width:100%; border:0; border-collapse:collapse; margin:0; table-layout:fixed; }
    table.school-print-layout > thead { display:table-header-group; }
    table.school-print-layout > tbody { display:table-row-group; }
    table.school-print-layout > thead > tr, table.school-print-layout > tbody > tr { break-inside:auto; page-break-inside:auto; }
    table.school-print-layout > thead > tr > td, table.school-print-layout > tbody > tr > td { border:0!important; padding:0!important; background:transparent!important; text-align:inherit; font-weight:inherit; vertical-align:top; }
    .school-print-header { padding:0 0 6mm; break-inside:avoid; page-break-inside:avoid; }
    .school-print-header img { display:block; width:100%; height:auto; object-fit:contain; }
    @media print { table.school-print-layout > thead { break-inside:avoid; page-break-inside:avoid; } }
  </style>`;
  const header = `<table class="school-print-layout"><thead><tr><td><div class="school-print-header"><img src="${logoUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" alt="شعار المدرسة"></div></td></tr></thead><tbody><tr><td>`;
  const documentHtml = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/head>/i, `${styles}</head>`)
    .replace(/<body([^>]*)>/i, `<body$1>${header}`)
    .replace(/<\/body>/i, "</td></tr></tbody></table></body>");
  target.document.write(documentHtml);
  target.document.close();
  // Wait for image decoding instead of a fixed timeout that can print an empty logo.
  void (async () => {
    try {
      await Promise.all(Array.from(target.document.images).map(img => img.decode()));
      await target.document.fonts.ready;
      if (!target.closed) { target.focus(); target.print(); }
    } catch {
      if (!target.closed) {
        const notice = target.document.createElement("p");
        notice.textContent = "تعذّر تحميل شعار الطباعة. أغلق النافذة وأعد محاولة الطباعة.";
        notice.setAttribute("role", "alert");
        target.document.body.prepend(notice);
      }
    }
  })();
}
