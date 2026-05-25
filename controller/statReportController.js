const escapePdfText = (value) =>
  String(value || "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");

const wrapLine = (value, length = 82) => {
  const words = String(value || "-").split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    if (`${line} ${word}`.trim().length > length) {
      lines.push(line);
      line = word;
      return;
    }

    line = `${line} ${word}`.trim();
  });

  if (line) {
    lines.push(line);
  }

  return lines.length ? lines : ["-"];
};

const getRowText = (row) => {
  if (typeof row === "string") return row;
  return row?.text || "-";
};

const getRowDate = (row) => {
  const value = typeof row === "string" ? "" : row?.date || row?.createdAt || "";

  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const isWithinRange = (row, fromDate, toDate) => {
  const rowDate = getRowDate(row);

  if (!rowDate) return true;
  if (fromDate && rowDate < fromDate) return false;
  if (toDate && rowDate > toDate) return false;

  return true;
};

const formatDateTime = () =>
  new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const cleanFileName = (value) => {
  const name = String(value || "stat-report")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-|-$/g, "");

  return name || "stat-report";
};

const prepareReport = (report, fromDate, toDate) => {
  const hasRange = Boolean(fromDate || toDate);
  const rows = (report.rows || []).filter((row) => isWithinRange(row, fromDate, toDate));

  return {
    ...report,
    dateRange: {
      from: fromDate,
      to: toDate,
    },
    metrics: hasRange
      ? [
          ...(report.metrics || []),
          { label: "Filtered From", value: fromDate || "Start" },
          { label: "Filtered To", value: toDate || "Today" },
          { label: "Matching Rows", value: rows.length },
        ]
      : report.metrics || [],
    rows,
  };
};

const createPdfBuffer = (report) => {
  const title = escapePdfText(report.title || "Stat Report");
  let y = 780;
  const content = [`BT /F1 22 Tf 50 ${y} Td (${title}) Tj ET`];

  y -= 28;
  content.push(`BT /F1 10 Tf 50 ${y} Td (Generated: ${escapePdfText(formatDateTime())}) Tj ET`);
  y -= 28;

  if (report.dateRange?.from || report.dateRange?.to) {
    const from = report.dateRange.from || "Start";
    const to = report.dateRange.to || "Today";
    content.push(`BT /F1 11 Tf 50 ${y} Td (Period: ${escapePdfText(from)} to ${escapePdfText(to)}) Tj ET`);
    y -= 22;
  }

  if (report.description) {
    wrapLine(report.description).forEach((line) => {
      content.push(`BT /F1 11 Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`);
      y -= 16;
    });
    y -= 8;
  }

  (report.metrics || []).forEach((metric) => {
    if (y < 60) return;
    content.push(`BT /F1 12 Tf 50 ${y} Td (${escapePdfText(metric.label)}: ${escapePdfText(metric.value)}) Tj ET`);
    y -= 20;
  });

  if ((report.rows || []).length) {
    y -= 8;
    content.push(`BT /F1 13 Tf 50 ${y} Td (Details) Tj ET`);
    y -= 22;

    report.rows.forEach((row) => {
      if (y < 60) return;

      wrapLine(getRowText(row)).forEach((line) => {
        if (y < 60) return;
        content.push(`BT /F1 10 Tf 58 ${y} Td (${escapePdfText(line)}) Tj ET`);
        y -= 15;
      });

      y -= 4;
    });
  }

  const stream = content.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf);
};

// download stat report
exports.downloadStatReport = async (req, res) => {
  try {
    const { report, fromDate, toDate } = req.body;

    // validation
    if (!report || !report.title) {
      return res.status(400).json({
        success: false,
        message: "Report title is required",
      });
    }

    if (fromDate && toDate && fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "From date must be before To date",
      });
    }

    const finalReport = prepareReport(report, fromDate, toDate);
    const pdfBuffer = createPdfBuffer(finalReport);
    const fileName = cleanFileName(finalReport.title);

    return res
      .status(200)
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        "Content-Length": pdfBuffer.length,
      })
      .send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};
