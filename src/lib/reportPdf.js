import { jsPDF } from "jspdf";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 46;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_TOP = 752;

export async function loadAttendanceReportLogo() {
  const response = await fetch("/logo-dbs.png");
  if (!response.ok) {
    throw new Error(`Não foi possível carregar o logo da empresa (${response.status}).`);
  }

  const logo = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Não foi possível processar o logo da empresa."));
    reader.readAsDataURL(logo);
  });
}

export function createAttendanceReportPdf({
  projectName,
  closingPeriod,
  startDate,
  endDate,
  total,
  rows,
  logoDataUrl,
}) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter", compress: true });
  let pageNumber = 1;
  paintPageWhite(pdf);
  pdf.setProperties({
    title: `Relatório de pagamento - ${projectName}`,
    subject: `Fechamento ${closingPeriod.toLowerCase()} de ${startDate} a ${endDate}`,
    creator: "DBS Engenharia",
  });

  let cursorY = drawFirstPageHeader(pdf, {
    projectName,
    closingPeriod,
    startDate,
    endDate,
    total,
    logoDataUrl,
  });

  for (const row of rows) {
    const layout = getEmployeeRowLayout(pdf, row);
    if (cursorY + layout.height > FOOTER_TOP) {
      pdf.addPage();
      pageNumber += 1;
      paintPageWhite(pdf);
      cursorY = drawSubsequentPageHeader(pdf, {
        projectName,
        startDate,
        endDate,
        logoDataUrl,
      });
    }

    drawEmployeeRow(pdf, row, cursorY, layout);
    cursorY += layout.height;
  }

  drawPageFooters(pdf, pageNumber);
  return pdf.output("blob");
}

function paintPageWhite(pdf) {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
}

function drawFirstPageHeader(pdf, {
  projectName,
  closingPeriod,
  startDate,
  endDate,
  total,
  logoDataUrl,
}) {
  const logoSize = 30;
  const logoY = 37;
  pdf.addImage(logoDataUrl, "PNG", MARGIN, logoY, logoSize, logoSize);

  const brandX = MARGIN + logoSize + 8;
  pdf.setFont("times", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(18, 18, 18);
  pdf.text("DBS ENGENHARIA", brandX, logoY + 13);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(79, 79, 79);
  pdf.text("Controle de Frequência de Obras", brandX, logoY + 25);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(38, 38, 38);
  pdf.text(projectName, MARGIN, 91);

  const badgeLabel = `FECHAMENTO ${closingPeriod.toUpperCase()}`;
  const badgeWidth = Math.max(130, pdf.getTextWidth(badgeLabel) + 22);
  pdf.setFillColor(234, 242, 255);
  pdf.setDrawColor(13, 78, 162);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(MARGIN, 100, badgeWidth, 23, 3, 3, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(10, 58, 120);
  pdf.text(badgeLabel, MARGIN + 9, 115);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(38, 38, 38);
  pdf.text(`Período de ${formatDate(startDate)} a ${formatDate(endDate)}`, MARGIN, 140);

  pdf.setDrawColor(13, 78, 162);
  pdf.setLineWidth(2);
  pdf.line(MARGIN, 155, PAGE_WIDTH - MARGIN, 155);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(13, 78, 162);
  pdf.text("FECHAMENTO DA CHAMADA", MARGIN, 183);

  pdf.setFont("times", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(18, 18, 18);
  pdf.text("Relatório de pagamento", MARGIN, 210);

  const dateCardY = 227;
  drawDateCard(pdf, MARGIN, dateCardY, "INÍCIO", formatDate(startDate), 128);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(79, 79, 79);
  pdf.text("até", MARGIN + 140, dateCardY + 30);
  drawDateCard(pdf, MARGIN + 166, dateCardY, "FIM", formatDate(endDate), 112);

  const totalY = 294;
  pdf.setFillColor(239, 249, 242);
  pdf.roundedRect(MARGIN, totalY, CONTENT_WIDTH, 85, 10, 10, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(24, 98, 61);
  pdf.text("TOTAL CONSOLIDADO DO PERÍODO", MARGIN + 17, totalY + 25);
  pdf.setFont("times", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(24, 98, 61);
  pdf.text(formatCurrency(total), MARGIN + 17, totalY + 60);

  return totalY + 99;
}

function drawSubsequentPageHeader(pdf, { projectName, startDate, endDate, logoDataUrl }) {
  const logoSize = 25;
  const logoY = 37;
  pdf.addImage(logoDataUrl, "PNG", MARGIN, logoY, logoSize, logoSize);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(18, 18, 18);
  pdf.text("DBS ENGENHARIA", MARGIN + logoSize + 8, logoY + 11);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(79, 79, 79);
  pdf.text(`${projectName}  ·  ${formatDate(startDate)} a ${formatDate(endDate)}`, MARGIN + logoSize + 8, logoY + 23);
  pdf.setDrawColor(13, 78, 162);
  pdf.setLineWidth(1.2);
  pdf.line(MARGIN, 77, PAGE_WIDTH - MARGIN, 77);
  return 92;
}

function drawDateCard(pdf, x, y, label, value, width) {
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(103, 134, 168);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(x, y, width, 54, 7, 7, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(13, 78, 162);
  pdf.text(label, x + 10, y + 18);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(38, 38, 38);
  pdf.text(value, x + 10, y + 38);
}

function getEmployeeRowLayout(pdf, { employee }) {
  const title = `${employee.name}${employee.role ? ` · ${employee.role}` : ""}`;
  const titleLines = pdf.splitTextToSize(title, CONTENT_WIDTH);
  const pixKey = employee.pix_key || "Chave Pix não informada";
  const pixLines = pdf.splitTextToSize(pixKey, CONTENT_WIDTH - 100);
  const titleHeight = titleLines.length * 15;
  const pixHeight = Math.max(13, pixLines.length * 13);
  const pixY = titleHeight + 102;

  return {
    titleLines,
    pixLines,
    titleHeight,
    pixHeight,
    pixY,
    height: pixY + pixHeight + 26,
  };
}

function drawEmployeeRow(pdf, { full, half, absent, total }, y, layout) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12.5);
  pdf.setTextColor(18, 18, 18);
  pdf.text(layout.titleLines, MARGIN, y + 13);

  const detailsY = y + layout.titleHeight + 31;
  const secondColumnX = MARGIN + 218;
  drawMetric(pdf, MARGIN, detailsY, "DIÁRIAS COMPLETAS", full, [22, 126, 71]);
  drawMetric(pdf, secondColumnX, detailsY, "MEIAS DIÁRIAS", half, [165, 106, 0]);
  drawMetric(pdf, MARGIN, detailsY + 40, "AUSENTES", absent, [198, 40, 40]);
  drawMetric(pdf, secondColumnX, detailsY + 40, "A RECEBER", formatCurrency(total), [20, 97, 56]);

  const pixY = y + layout.pixY;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(79, 79, 79);
  pdf.text("CHAVE PIX", MARGIN, pixY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11.5);
  pdf.setTextColor(38, 38, 38);
  pdf.text(layout.pixLines, MARGIN + 82, pixY);

  const dividerY = y + layout.height - 4;
  pdf.setDrawColor(222, 222, 222);
  pdf.setLineWidth(0.7);
  pdf.line(MARGIN, dividerY, PAGE_WIDTH - MARGIN, dividerY);
}

function drawMetric(pdf, x, y, label, value, color) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...color);
  pdf.text(label, x, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.text(String(value), x, y + 15);
}

function drawPageFooters(pdf, pageCount) {
  const generatedAt = new Date().toLocaleString("pt-BR");
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(222, 222, 222);
    pdf.setLineWidth(0.6);
    pdf.line(MARGIN, FOOTER_TOP, PAGE_WIDTH - MARGIN, FOOTER_TOP);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(140, 140, 140);
    pdf.text("dbsengenharia1.vercel.app/relatorios", MARGIN, FOOTER_TOP + 13);
    pdf.text(`${generatedAt}  ·  Página ${page} de ${pageCount}`, PAGE_WIDTH - MARGIN, FOOTER_TOP + 13, {
      align: "right",
    });
  }
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
