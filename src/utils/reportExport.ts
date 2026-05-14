import type { Report, ReportType } from "@/services/api";

type ExportRow = {
  label: string;
  value: string | number;
};

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  BRANCH_PERFORMANCE: 'Branch Performance',
  SALES_SUMMARY: 'Sales Summary',
  ORDER_SUMMARY: 'Order Summary',
};

function reportTypeLabel(reportType: string): string {
  return REPORT_TYPE_LABELS[reportType as ReportType] ?? reportType;
}

function fmtDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
}

function fmtMoney(value: number | null | undefined): string {
  if (value == null) return '0';
  return `NGN ${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function reportRows(report: Report, branchName: string): ExportRow[] {
  return [
    { label: 'Report ID', value: report.id },
    { label: 'Report Type', value: reportTypeLabel(report.reportType) },
    { label: 'Branch', value: branchName },
    { label: 'Start Date', value: fmtDate(report.startDate) },
    { label: 'End Date', value: fmtDate(report.endDate) },
    { label: 'Generated At', value: new Date(report.generatedAt).toLocaleString('en-NG') },
    { label: 'Total Orders', value: report.totalOrders ?? 0 },
    { label: 'Completed Orders', value: report.completedOrders ?? 0 },
    { label: 'Cancelled Orders', value: report.cancelledOrders ?? 0 },
    { label: 'In Progress Orders', value: report.inProgressOrders ?? 0 },
    { label: 'Total Revenue', value: fmtMoney(report.totalRevenue) },
    { label: 'Average Order Value', value: fmtMoney(report.avgOrderValue) },
    { label: 'Completion Rate', value: `${report.completionRate.toFixed(1)}%` },
    { label: 'Cancellation Rate', value: `${report.cancellationRate.toFixed(1)}%` },
    { label: 'Dine-In Orders', value: report.dineInCount ?? 0 },
    { label: 'Takeaway Orders', value: report.takeawayCount ?? 0 },
    { label: 'Delivery Orders', value: report.deliveryCount ?? 0 },
  ];
}

function filename(report: Report, branchName: string, extension: 'pdf' | 'xlsx'): string {
  const type = reportTypeLabel(report.reportType).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const branch = branchName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'All-Branches';
  return `${type}-${branch}-${report.startDate}-to-${report.endDate}.${extension}`;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function pdfEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createPdfBlob(report: Report, branchName: string): Blob {
  const rows = reportRows(report, branchName);
  const title = `${reportTypeLabel(report.reportType)} Report`;
  const lines = [
    title,
    `${fmtDate(report.startDate)} to ${fmtDate(report.endDate)}`,
    '',
    ...rows.map(row => `${row.label}: ${row.value}`),
  ];

  const content = [
    'BT',
    '/F1 18 Tf',
    '50 780 Td',
    `(${pdfEscape(lines[0])}) Tj`,
    '/F1 11 Tf',
    '0 -24 Td',
    ...lines.slice(1).flatMap(line => [`(${pdfEscape(String(line))}) Tj`, '0 -17 Td']),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([body], { type: 'application/pdf' });
}

function xmlEscape(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnName(index: number): string {
  let name = '';
  let n = index;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function createSheetXml(rows: Array<Array<string | number>>): string {
  const sheetRows = rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cells = row.map((cell, cellIndex) => {
      const ref = `${columnName(cellIndex + 1)}${rowNumber}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`;
    }).join('');
    return `<row r="${rowNumber}">${cells}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="2" width="36" customWidth="1"/></cols>
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  data.forEach(byte => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(bytes: number[], value: number) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(bytes: number[], value: number) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function createZip(files: Array<{ name: string; content: string }>): Blob {
  const encoder = new TextEncoder();
  const output: number[] = [];
  const centralDirectory: number[] = [];

  files.forEach(file => {
    const nameBytes = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const localOffset = output.length;

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint32(output, crc);
    writeUint32(output, data.length);
    writeUint32(output, data.length);
    writeUint16(output, nameBytes.length);
    writeUint16(output, 0);
    output.push(...nameBytes, ...data);

    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, crc);
    writeUint32(centralDirectory, data.length);
    writeUint32(centralDirectory, data.length);
    writeUint16(centralDirectory, nameBytes.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, localOffset);
    centralDirectory.push(...nameBytes);
  });

  const centralOffset = output.length;
  output.push(...centralDirectory);
  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, files.length);
  writeUint16(output, files.length);
  writeUint32(output, centralDirectory.length);
  writeUint32(output, centralOffset);
  writeUint16(output, 0);

  return new Blob([new Uint8Array(output)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function createXlsxBlob(report: Report, branchName: string): Blob {
  const rows = [
    ['FoodChain Report', ''],
    ['Report Type', reportTypeLabel(report.reportType)],
    ['Period', `${fmtDate(report.startDate)} to ${fmtDate(report.endDate)}`],
    ['Branch', branchName],
    [],
    ['Metric', 'Value'],
    ...reportRows(report, branchName).map(row => [row.label, row.value]),
  ];

  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    },
    { name: 'xl/worksheets/sheet1.xml', content: createSheetXml(rows) },
  ];

  return createZip(files);
}

export function downloadReportPdf(report: Report, branchName: string) {
  downloadBlob(createPdfBlob(report, branchName), filename(report, branchName, 'pdf'));
}

export function downloadReportXlsx(report: Report, branchName: string) {
  downloadBlob(createXlsxBlob(report, branchName), filename(report, branchName, 'xlsx'));
}
