/**
 * CSV files an admin downloads and opens in Excel or pastes into Google Sheets.
 *
 * Every cell is quoted, and the file starts with a UTF-8 BOM — without it Excel
 * reads the file as the system code page and every Thai name turns to noise.
 */

/**
 * Characters that make Excel / Sheets read a cell as a formula. A name or group
 * typed as `=HYPERLINK(...)` would otherwise run when the file is opened, so
 * such a cell is prefixed with `'`, which both apps treat as "this is text".
 */
const FORMULA_START = /^[=+\-@\t\r]/

function cell(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

export function toCsv(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const lines = [headers, ...rows].map((row) => row.map(cell).join(','))
  return '﻿' + lines.join('\r\n')
}

/** `YYYY-MM-DD` in the viewer's own timezone — a UTC date names yesterday until 07:00 in Bangkok. */
export function csvDateStamp(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** A dashboard name made safe as part of a file name on Windows and macOS. */
export function fileNamePart(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim() || 'dashboard'
}

/** Hand the browser a CSV to save. */
export function downloadCsv(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
