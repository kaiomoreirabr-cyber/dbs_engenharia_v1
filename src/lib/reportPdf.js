import { jsPDF } from "jspdf";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_TOP = 283;

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
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
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
    employeeCount: rows.length,
    logoDataUrl,
  });

  for (const row of rows) {
    const layout = getEmployeeRowLayout(pdf, row);
    if (cursorY + layout.height > FOOTER_TOP - 4) {
      pdf.addPage();
      pageNumber += 1;
      paintPageWhite(pdf);
      cursorY = drawContinuationHeader(pdf, { projectName, startDate, endDate, logoDataUrl });
    }

    drawEmployeeRow(pdf, row, cursorY, layout);
    cursorY += layout.height + 4;
  }

  drawPageFooters(pdf, pageNumber);
  return pdf.output("blob");
}

function paintPageWhite(pdf) {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
}

function drawBrandHeader(pdf, logoDataUrl, label = null) {
  const headerY = 13;
  const headerHeight = 29;

  pdf.setFillColor(244, 248, 253);
  pdf.roundedRect(MARGIN, headerY, CONTENT_WIDTH, headerHeight, 3, 3, "F");
  pdf.setFillColor(13, 78, 162);
  pdf.roundedRect(MARGIN, headerY, 2.2, headerHeight, 1, 1, "F");
  pdf.addImage(logoDataUrl, "PNG", MARGIN + 7, headerY + 7, 16, 16);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(18, 18, 18);
  pdf.text("DBS ENGENHARIA", MARGIN + 27, headerY + 13);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(79, 79, 79);
  pdf.text("Controle de Frequência de Obras", MARGIN + 27, headerY + 20);

  if (label) {
    const badgeWidth = 57;
    const badgeX = PAGE_WIDTH - MARGIN - badgeWidth - 5;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(207, 220, 239);
    pdf.roundedRect(badgeX, headerY + 9, badgeWidth, 11, 2, 2, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.7);
    pdf.setTextColor(13, 78, 162);
    pdf.text(label, badgeX + badgeWidth / 2, headerY + 15.8, { align: "center" });
  }
}

function drawFirstPageHeader(pdf, {
  projectName,
  closingPeriod,
  startDate,
  endDate,
  total,
  employeeCount,
  logoDataUrl,
}) {
  drawBrandHeader(pdf, logoDataUrl, `FECHAMENTO ${closingPeriod.toUpperCase()}`);

  const projectLines = pdf.splitTextToSize(projectName, 116);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(103, 103, 103);
  pdf.text("OBRA", MARGIN, 57);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(18, 18, 18);
  pdf.text(projectLines, MARGIN, 63);

  const periodY = 63 + (projectLines.length - 1) * 5 + 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(79, 79, 79);
  pdf.text(`${formatDate(startDate)} a ${formatDate(endDate)}`, MARGIN, periodY);

  const dividerY = periodY + 5;
  pdf.setDrawColor(13, 78, 162);
  pdf.setLineWidth(0.8);
  pdf.line(MARGIN, dividerY, PAGE_WIDTH - MARGIN, dividerY);

  const sectionY = dividerY + 9;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(45, 99, 161);
  pdf.text("FECHAMENTO DA CHAMADA", MARGIN, sectionY);
  pdf.setFont("times", "bold");
  pdf.setFontSize(19);
  pdf.setTextColor(18, 18, 18);
  pdf.text("Relatório de pagamento", MARGIN, sectionY + 9);

  const dateCardY = sectionY + 15;
  drawDateCard(pdf, MARGIN, dateCardY, "INÍCIO", formatDate(startDate), 46);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(103, 103, 103);
  pdf.text("ATÉ", MARGIN + 49, dateCardY + 9);
  drawDateCard(pdf, MARGIN + 58, dateCardY, "FIM", formatDate(endDate), 46);

  const totalY = dateCardY + 21;
  pdf.setFillColor(241, 249, 244);
  pdf.roundedRect(MARGIN, totalY, CONTENT_WIDTH, 30, 3, 3, "F");
  pdf.setFillColor(35, 138, 85);
  pdf.roundedRect(MARGIN, totalY, 2.2, 30, 1, 1, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(81, 115, 94);
  pdf.text("TOTAL CONSOLIDADO", MARGIN + 7, totalY + 8);
  pdf.setFont("times", "bold");
  pdf.setFontSize(19);
  pdf.setTextColor(24, 98, 61);
  pdf.text(formatCurrency(total), MARGIN + 7, totalY + 22);

  const summaryX = PAGE_WIDTH - MARGIN - 48;
  pdf.setDrawColor(205, 227, 211);
  pdf.setLineWidth(0.35);
  pdf.line(summaryX - 7, totalY + 5, summaryX - 7, totalY + 25);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6);
  pdf.setTextColor(81, 115, 94);
  pdf.text("COLABORADORES", summaryX, totalY + 10);
  pdf.setFontSize(12);
  pdf.setTextColor(24, 98, 61);
  pdf.text(String(employeeCount), summaryX, totalY + 18);

  return totalY + 37;
}

function drawDateCard(pdf, x, y, label, value, width) {
  pdf.setFillColor(249, 251, 254);
  pdf.setDrawColor(207, 220, 239);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(x, y, width, 16, 2, 2, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.2);
  pdf.setTextColor(45, 99, 161);
  pdf.text(label, x + 3, y + 5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(38, 38, 38);
  pdf.text(value, x + 3, y + 11.5);
}

function drawContinuationHeader(pdf, { projectName, startDate, endDate, logoDataUrl }) {
  drawBrandHeader(pdf, logoDataUrl);
  const projectLines = pdf.splitTextToSize(
    `${projectName} · ${formatDate(startDate)} a ${formatDate(endDate)}`,
    CONTENT_WIDTH
  );
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(79, 79, 79);
  pdf.text(projectLines, MARGIN, 51);
  const dividerY = 55 + (projectLines.length - 1) * 4;
  pdf.setDrawColor(13, 78, 162);
  pdf.setLineWidth(0.6);
  pdf.line(MARGIN, dividerY, PAGE_WIDTH - MARGIN, dividerY);
  return dividerY + 9;
}

function getEmployeeRowLayout(pdf, { employee }) {
  const employeeTitle = `${employee.name}${employee.role ? ` · ${employee.role}` : ""}`;
  const titleLines = pdf.splitTextToSize(employeeTitle, 116);
  const pixKey = employee.pix_key || "Chave Pix não informada";
  const pixLabelWidth = 26;
  const pixLines = pdf.splitTextToSize(pixKey, CONTENT_WIDTH - pixLabelWidth - 12);
  const titleHeight = Math.max(5, titleLines.length * 4.2);
  const pixHeight = Math.max(4, pixLines.length * 4.1);
  const metricsTop = Math.max(17, titleHeight + 8);
  const pixTop = metricsTop + 18;

  return {
    titleLines,
    pixLines,
    pixLabelWidth,
    titleHeight,
    pixHeight,
    metricsTop,
    pixTop,
    height: pixTop + pixHeight + 8,
  };
}

function drawEmployeeRow(pdf, { full, half, absent, total }, y, layout) {
  const cardX = MARGIN;
  const cardWidth = CONTENT_WIDTH;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 239);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(cardX, y, cardWidth, layout.height, 2.5, 2.5, "FD");
  pdf.setFillColor(45, 99, 161);
  pdf.roundedRect(cardX, y + 2.5, 1.2, layout.height - 5, 0.6, 0.6, "F");

  const contentX = cardX + 6;
  const paymentWidth = 38;
  const paymentX = cardX + cardWidth - paymentWidth - 5;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(18, 18, 18);
  pdf.text(layout.titleLines, contentX, y + 7.5);

  pdf.setFillColor(239, 249, 242);
  pdf.roundedRect(paymentX, y + 3, paymentWidth, 13, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6);
  pdf.setTextColor(81, 115, 94);
  pdf.text("A RECEBER", paymentX + 3, y + 7);
  pdf.setFontSize(8);
  pdf.setTextColor(24, 98, 61);
  pdf.text(formatCurrency(total), paymentX + 3, y + 13);

  const metricsY = y + layout.metricsTop;
  const gap = 3;
  const metricWidth = (CONTENT_WIDTH - 12 - gap * 2) / 3;
  const metrics = [
    { label: "DIÁRIAS COMPLETAS", value: full, color: [22, 126, 71], bg: [239, 249, 242] },
    { label: "MEIAS DIÁRIAS", value: half, color: [165, 106, 0], bg: [255, 248, 238] },
    { label: "AUSENTES", value: absent, color: [183, 59, 59], bg: [255, 243, 243] },
  ];

  metrics.forEach((metric, index) => {
    drawMetricCard(pdf, contentX + index * (metricWidth + gap), metricsY, metricWidth, metric);
  });

  const pixY = y + layout.pixTop;
  pdf.setDrawColor(235, 239, 244);
  pdf.setLineWidth(0.3);
  pdf.line(contentX, pixY - 4, cardX + cardWidth - 5, pixY - 4);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.setTextColor(81, 103, 130);
  pdf.text("CHAVE PIX", contentX, pixY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(38, 38, 38);
  pdf.text(layout.pixLines, contentX + layout.pixLabelWidth, pixY);
}

function drawMetricCard(pdf, x, y, width, { label, value, color, bg }) {
  pdf.setFillColor(...bg);
  pdf.roundedRect(x, y, width, 14, 1.8, 1.8, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.8);
  pdf.setTextColor(...color);
  pdf.text(label, x + 2.5, y + 5);
  pdf.setFontSize(8.5);
  pdf.text(String(value), x + 2.5, y + 11);
}

function drawPageFooters(pdf, pageCount) {
  const generatedAt = new Date().toLocaleString("pt-BR");
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(220, 228, 238);
    pdf.setLineWidth(0.35);
    pdf.line(MARGIN, FOOTER_TOP, PAGE_WIDTH - MARGIN, FOOTER_TOP);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.2);
    pdf.setTextColor(81, 103, 130);
    pdf.text("DBS ENGENHARIA  ·  RELATÓRIO DE PAGAMENTO", MARGIN, FOOTER_TOP + 5);
    pdf.setTextColor(103, 103, 103);
    pdf.text(`${generatedAt}  ·  PÁGINA ${page} DE ${pageCount}`, PAGE_WIDTH - MARGIN, FOOTER_TOP + 5, {
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
