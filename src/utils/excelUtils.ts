import * as XLSX from 'xlsx';

export interface ImportResult<T> {
  data: T[];
  errors: string[];
}

/**
 * Utility function to export JSON data to an Excel file (.xlsx)
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Dados'
) {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-fit column widths
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      worksheet['!cols'] = keys.map((key) => {
        const maxLen = Math.max(
          key.length,
          ...data.map((row) => String(row[key] ?? '').length)
        );
        return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
      });
    }

    const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(workbook, cleanFilename);
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    throw error;
  }
}

/**
 * Read and parse an Excel/CSV file uploaded by user
 */
export async function parseExcelFile<T = Record<string, any>>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

/**
 * Generate and download a template Excel file
 */
export function downloadExcelTemplate(
  columns: { header: string; example: string }[],
  filename: string,
  sheetName: string = 'Modelo_Importacao'
) {
  const rowExample: Record<string, string> = {};
  columns.forEach((col) => {
    rowExample[col.header] = col.example;
  });

  const worksheet = XLSX.utils.json_to_sheet([rowExample]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  worksheet['!cols'] = columns.map((col) => ({
    wch: Math.max(col.header.length, col.example.length, 15) + 4,
  }));

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}
