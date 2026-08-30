'use strict';
// Excel generator (SheetJS/xlsx). Runs in the Electron main process.
const fs = require('fs');
const XLSX = require('xlsx');

function generate(data, savePath) {
  const wb = XLSX.utils.book_new();
  const sheetName = (data.sheet || data.title || 'Report').slice(0, 31);
  const company = data.company || {};

  const headerRows = [
    [company.name || 'VyaparBooks'],
    [data.title || 'Report'],
    data.subtitle ? [data.subtitle] : [],
    ['Generated: ' + new Date().toLocaleString()],
    [],
  ].filter((r) => r && r.length);

  let body = [];
  const colHeaderIndex = headerRows.length;
  let columnHeaderRow = [];
  if (data.columns && data.columns.length) {
    columnHeaderRow = data.columns.map((c) => c.label || c);
    body.push(columnHeaderRow);
    for (const r of (data.rows || [])) {
      body.push(data.columns.map((c) => {
        const key = c.key !== undefined ? c.key : c;
        const v = r[key];
        return c.num && !isNaN(Number(v)) ? Number(v) : v;
      }));
    }
  } else if (data.rows && data.rows.length && Array.isArray(data.rows[0])) {
    body = body.concat(data.rows);
  }

  const aoa = headerRows.concat(body);
  if (data.totals && data.totals.length) {
    aoa.push([]);
    for (const t of data.totals) aoa.push([t.label, t.amount !== undefined ? Number(t.amount) : (t.value || '')]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const maxCols = Math.max(0, ...body.map((r) => r.length));
  const widths = [];
  for (let c = 0; c < maxCols; c++) {
    let mx = 10;
    const scan = (rowSets) => {
      for (const row of rowSets) {
        if (row && row[c] != null) mx = Math.max(mx, String(row[c]).length + 2);
      }
    };
    scan([columnHeaderRow]);
    scan(data.rows);
    widths.push({ wch: Math.min(42, mx) });
  }
  ws['!cols'] = widths;

  // Bold the header/title rows and the column header row.
  const applicable = [];
  for (let r = 0; r < headerRows.length; r++) applicable.push({ r, row: headerRows[r] });
  for (const { r, row } of applicable) {
    if (!row) continue;
    const cellRef = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws[cellRef]) {
      ws[cellRef].s = { font: { bold: true, sz: r === 0 ? 14 : 10, color: r === 0 ? { rgb: '1E40AF' } : { rgb: '1E293B' } } };
      ws[cellRef].s.alignment = { horizontal: 'left' };
    }
  }
  if (data.columns && data.columns.length) {
    for (let c = 0; c < columnHeaderRow.length; c++) {
      const ref = XLSX.utils.encode_cell({ r: colHeaderIndex, c });
      if (ws[ref]) {
        ws[ref].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E40AF' } }, alignment: { horizontal: data.columns[c].num ? 'right' : 'left' } };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, savePath);
  return savePath;
}

module.exports = { generate };
