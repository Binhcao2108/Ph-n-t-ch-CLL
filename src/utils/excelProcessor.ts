import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { CLLRawRow, DungHenRawRow, MergedRecord, TransitionRecord, SummaryStats, ChartDataItem } from '../types';

// Robust key extractor for column mappings
export function getRowValue(row: any, searchKeys: string[]): string {
  if (!row) return '';
  for (const key of Object.keys(row)) {
    const cleanKey = key.toLowerCase().replace(/[\(\)\s_-]/g, '').trim();
    for (const searchKey of searchKeys) {
      const cleanSearchKey = searchKey.toLowerCase().replace(/[\(\)\s_-]/g, '').trim();
      if (cleanKey === cleanSearchKey || cleanKey.includes(cleanSearchKey)) {
        const val = row[key];
        if (val === undefined || val === null) return '';
        return String(val).trim();
      }
    }
  }
  return '';
}

// Extract row values specifically for Contract Number (Số HĐ)
export function getContractNumber(row: any): string {
  const keys = ['số hđ', 'so hd', 'contract', 'mã hđ', 'ma hd', 'hợp đồng', 'hop dong'];
  return getRowValue(row, keys);
}

// Convert Excel Serial Date or Date string to JS Date
export function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    // Excel base date is Dec 30, 1899 due to 1900 leap year bug
    const date = new Date((val - 25569) * 86400 * 1000);
    // Adjust for typical timezone drift
    return date;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const s = val.trim();
    // Normalizing slash / hyphens
    const dmytm = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (dmytm) {
      const day = parseInt(dmytm[1], 10);
      const month = parseInt(dmytm[2], 10) - 1; // 0-based
      const year = parseInt(dmytm[3], 10);
      const hour = parseInt(dmytm[4], 10);
      const min = parseInt(dmytm[5], 10);
      const sec = dmytm[6] ? parseInt(dmytm[6], 10) : 0;
      return new Date(year, month, day, hour, min, sec);
    }
    // Match DD/MM/YYYY
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10) - 1;
      const year = parseInt(dmy[3], 10);
      return new Date(year, month, day);
    }
    const parsed = Date.parse(s);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
  }
  return null;
}

// Format Date object to dynamic Vietnamese standard string (DD/MM/YYYY HH:mm:ss)
export function formatDate(date: Date | null): string {
  if (!date) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${d}/${m}/${y} ${h}:${min}:${sec}`;
}

// Categorize Input Status (Tình trạng đầu vào) according to prompt specifications
export function categorizeInputStatus(val: string | undefined): 'Mất mạng' | 'Wifi yếu' | 'Camera lỗi' | 'Chập chờn' | 'Khác' {
  if (!val) return 'Khác';
  const clean = val.toLowerCase().replace(/\s+/g, ' ').trim();
  
  if (
    clean.includes('mất mạng') || 
    clean.includes('mat mang') || 
    clean.includes('không truy cập') || 
    clean.includes('khong truy cap') ||
    clean.includes('rớt mạng') ||
    clean.includes('rot mang')
  ) {
    return 'Mất mạng';
  }
  if (
    clean.includes('wifi') && 
    (clean.includes('yếu') || clean.includes('yeu') || clean.includes('chậm') || clean.includes('cham') || clean.includes('kém') || clean.includes('kem'))
  ) {
    return 'Wifi yếu';
  }
  if (
    clean.includes('camera') || 
    clean.includes('cam lỗi') || 
    clean.includes('hư cam')
  ) {
    return 'Camera lỗi';
  }
  if (
    clean.includes('chập chờn') || 
    clean.includes('chap chon') || 
    clean.includes('châp chon') || 
    clean.includes('lúc được lúc không') || 
    clean.includes('luc duoc luc khong') || 
    clean.includes('chập chon')
  ) {
    return 'Chập chờn';
  }
  
  return 'Khác';
}

// Read an Excel file as JSON rows via SheetJS
export function readExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Không đọc được dữ liệu file');
        }
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, cellNF: false });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

// Main processing logic
export function processCLLData(
  cllRows: CLLRawRow[],
  dungHenRows: DungHenRawRow[]
): MergedRecord[] {
  const mergedRecords: MergedRecord[] = [];

  // Index Dung Hen records by Contract Number for rapid lookups and time proximity matches
  const dungHenMap = new Map<string, DungHenRawRow[]>();
  
  for (const row of dungHenRows) {
    const hđRaw = getContractNumber(row);
    if (!hđRaw) continue;
    const cleanHd = hđRaw.trim().toUpperCase();
    if (!dungHenMap.has(cleanHd)) {
      dungHenMap.set(cleanHd, []);
    }
    dungHenMap.get(cleanHd)!.push(row);
  }

  // Iterate over CLL records (which act as L1 and contain CLPS timestamp)
  for (let i = 0; i < cllRows.length; i++) {
    const row = cllRows[i];
    const contract = getContractNumber(row).toUpperCase().trim();
    if (!contract) continue;

    // L1 times
    const l1TimeRaw = row['Tg hoàn tất'] || row['TG Hoàn Tất'] || row['tg hoàn tất'];
    const l1TimeDate = parseExcelDate(l1TimeRaw);
    const completedTimeL1 = formatDate(l1TimeDate);

    // L2 times (CLPS) from CLL row
    const l2TimeRaw = row['Tg hoàn tất CLPS'] || row['Tg hoàn tất clps'] || row['TG Hoàn Tất CLPS'];
    const l2TimeDate = parseExcelDate(l2TimeRaw);

    // L2 note is taken from the CLL source: row
    const notesL2 = getRowValue(row, ['Ghi chú', 'ghi chu', 'Note']);
    
    const inputStatusL1 = getRowValue(row, ['Tình trạng đầu vào', 'tình trạng đầu vào', 'status']);
    const errorElementL1 = getRowValue(row, ['Phần tử lỗi', 'phần tử lỗi', 'element']);
    const errorCauseL1 = getRowValue(row, ['Nguyên nhân lỗi', 'nguyên nhân lỗi', 'cause']);
    const handlingL1 = getRowValue(row, ['Hướng xử lý', 'hướng xử lý', 'handling']);
    const staffL1 = getRowValue(row, ['Nhân viên kỹ thuật', 'Kỹ thuật', 'Kỹ thuật thực hiện', 'Nhân viên thực hiện', 'Người thực hiện', 'Nhân viên xử lý', 'Người xử lý', 'Nhân viên', 'KTV', 'nvkt', 'nhân viên kt', 'Người giải quyết', 'người được phối hợp', 'nv thực hiện']);

    // Attempt to find matching CLPS record in Dung Hen
    const candidates = dungHenMap.get(contract) || [];
    let bestMatch: DungHenRawRow | null = null;
    let minDiffMinutes = Infinity;

    if (candidates.length > 0) {
      if (l2TimeDate) {
        // Find candidate closest to CLPS completed time (Tg hoàn tất CLPS)
        for (const cand of candidates) {
          const candTimeRaw = cand['TG Hoàn Tất'] || cand['Tg hoàn tất'] || cand['tg hoàn tất'] || cand['TG Hoàn tất'];
          const candTimeDate = parseExcelDate(candTimeRaw);
          if (candTimeDate) {
            const diffMs = Math.abs(candTimeDate.getTime() - l2TimeDate.getTime());
            const diffMinutes = diffMs / (60 * 1000);
            if (diffMinutes < minDiffMinutes) {
              minDiffMinutes = diffMinutes;
              bestMatch = cand;
            }
          }
        }
      } else {
        // If we don't have L2 time to compare, pick the first candidate as fallback
        bestMatch = candidates[0];
      }
    }

    if (bestMatch) {
      const matchTimeRaw = bestMatch['TG Hoàn Tất'] || bestMatch['Tg hoàn tất'] || bestMatch['tg hoàn tất'];
      const matchTimeDate = parseExcelDate(matchTimeRaw) || l2TimeDate;
      const completedTimeL2 = formatDate(matchTimeDate);

      // L1 note is taken from the matching Dung Hen source: bestMatch
      const notesL1 = getRowValue(bestMatch, ['Ghi chú', 'ghi chu', 'Note']);
      const inputStatusL2 = getRowValue(bestMatch, ['Tình trạng đầu vào', 'tình trạng đầu vào', 'status']);
      const errorElementL2 = getRowValue(bestMatch, ['Phần tử lỗi', 'phần tử lỗi', 'element']);
      const errorCauseL2 = getRowValue(bestMatch, ['Nguyên nhân lỗi', 'nguyên nhân lỗi', 'cause']);
      const handlingL2 = getRowValue(bestMatch, ['Hướng xử lý', 'hướng xử lý', 'handling']);
      const staffL2 = getRowValue(bestMatch, ['Nhân viên kỹ thuật', 'Kỹ thuật', 'Kỹ thuật thực hiện', 'Nhân viên thực hiện', 'Người thực hiện', 'Nhân viên xử lý', 'Người xử lý', 'Nhân viên', 'KTV', 'nvkt', 'nhân viên kt', 'Người giải quyết', 'người được phối hợp', 'nv thực hiện']);

      mergedRecords.push({
        id: `${contract}_${i}`,
        contractNumber: contract,
        
        completedTimeL1,
        completedTimeL1Raw: l1TimeRaw,
        notesL1,
        inputStatusL1,
        errorElementL1,
        errorCauseL1,
        handlingL1,
        
        completedTimeL2,
        completedTimeL2Raw: matchTimeRaw || l2TimeRaw,
        notesL2,
        inputStatusL2,
        errorElementL2,
        errorCauseL2,
        handlingL2,
        
        status: 'SUCCESS',
        timeDifferenceMinutes: minDiffMinutes !== Infinity ? Math.round(minDiffMinutes) : undefined,
        staffL1,
        staffL2
      });
    } else {
      // Not found CLPS ticket in Dung Hen
      const completedTimeL2 = formatDate(l2TimeDate);
      mergedRecords.push({
        id: `${contract}_${i}`,
        contractNumber: contract,
        
        completedTimeL1,
        completedTimeL1Raw: l1TimeRaw,
        notesL1: '',
        inputStatusL1,
        errorElementL1,
        errorCauseL1,
        handlingL1,
        
        completedTimeL2,
        completedTimeL2Raw: l2TimeRaw,
        notesL2,
        inputStatusL2: '',
        errorElementL2: '',
        errorCauseL2: '',
        handlingL2: '',
        
        status: 'NOT_FOUND',
        staffL1
      });
    }
  }

  return mergedRecords;
}

// Extract statistic data from the merged list
export function calculateStatistics(records: MergedRecord[]) {
  // 1. Tình trạng đầu vào: Count of raw values from the file
  const inputStatusCountsL1: Record<string, number> = {};
  const inputStatusCountsL2: Record<string, number> = {};

  // 2. Dynamic fields count
  const errorElementCountsL1: Record<string, number> = {};
  const errorElementCountsL2: Record<string, number> = {};

  const errorCauseCountsL1: Record<string, number> = {};
  const errorCauseCountsL2: Record<string, number> = {};

  const handlingCountsL1: Record<string, number> = {};
  const handlingCountsL2: Record<string, number> = {};

  const staffL1Counts: Record<string, number> = {};
  const staffL2Counts: Record<string, number> = {};

  // 3. Transitions
  const transitionCounts: Record<string, number> = {};

  for (const rec of records) {
    // 1. Tình trạng đầu vào
    const isL1 = rec.inputStatusL1 ? rec.inputStatusL1.trim() : "(Trống)";
    inputStatusCountsL1[isL1] = (inputStatusCountsL1[isL1] || 0) + 1;
    
    const isL2 = rec.inputStatusL2 ? rec.inputStatusL2.trim() : "(Trống)";
    inputStatusCountsL2[isL2] = (inputStatusCountsL2[isL2] || 0) + 1;

    // 2. Phần tử lỗi
    const elL1 = rec.errorElementL1 ? rec.errorElementL1.trim() : "(Trống)";
    errorElementCountsL1[elL1] = (errorElementCountsL1[elL1] || 0) + 1;
    
    const elL2 = rec.errorElementL2 ? rec.errorElementL2.trim() : "(Trống)";
    errorElementCountsL2[elL2] = (errorElementCountsL2[elL2] || 0) + 1;

    // 3. Nguyên nhân lỗi
    const ecL1 = rec.errorCauseL1 ? rec.errorCauseL1.trim() : "(Trống)";
    errorCauseCountsL1[ecL1] = (errorCauseCountsL1[ecL1] || 0) + 1;
    
    const ecL2 = rec.errorCauseL2 ? rec.errorCauseL2.trim() : "(Trống)";
    errorCauseCountsL2[ecL2] = (errorCauseCountsL2[ecL2] || 0) + 1;

    // 4. Hướng xử lý
    const hdL1 = rec.handlingL1 ? rec.handlingL1.trim() : "(Trống)";
    handlingCountsL1[hdL1] = (handlingCountsL1[hdL1] || 0) + 1;
    
    const hdL2 = rec.handlingL2 ? rec.handlingL2.trim() : "(Trống)";
    handlingCountsL2[hdL2] = (handlingCountsL2[hdL2] || 0) + 1;

    // 5. Nhân sự
    const sfL1 = rec.staffL1 ? rec.staffL1.trim() : "(Trống)";
    staffL1Counts[sfL1] = (staffL1Counts[sfL1] || 0) + 1;
    
    const sfL2 = rec.staffL2 ? rec.staffL2.trim() : "(Trống)";
    staffL2Counts[sfL2] = (staffL2Counts[sfL2] || 0) + 1;

    // 6. Cause Transition (Nguyên nhân lỗi L1 -> L2) - Only look at matched success cases
    if (rec.status === 'SUCCESS' && rec.errorCauseL1 && rec.errorCauseL2) {
      const causeL1 = rec.errorCauseL1.trim();
      const causeL2 = rec.errorCauseL2.trim();
      const key = `${causeL1} → ${causeL2}`;
      transitionCounts[key] = (transitionCounts[key] || 0) + 1;
    }
  }

  const getSortedChartData = (countsL1: Record<string, number>, countsL2: Record<string, number>): ChartDataItem[] => {
    const allKeys = Array.from(new Set([...Object.keys(countsL1), ...Object.keys(countsL2)]));
    return allKeys
      .map(key => ({
        name: key,
        'Lần 1': countsL1[key] || 0,
        'Lần 2': countsL2[key] || 0
      }))
      .sort((a, b) => (b['Lần 1'] + b['Lần 2']) - (a['Lần 1'] + a['Lần 2']));
  };

  const chartInputStatus = getSortedChartData(inputStatusCountsL1, inputStatusCountsL2);
  const chartErrorElement = getSortedChartData(errorElementCountsL1, errorElementCountsL2);
  const chartErrorCause = getSortedChartData(errorCauseCountsL1, errorCauseCountsL2);
  const chartHandling = getSortedChartData(handlingCountsL1, handlingCountsL2);
  const chartStaffL1 = getSortedChartData(staffL1Counts, {});
  const chartStaffL2 = getSortedChartData({}, staffL2Counts);
  const chartStaff = getSortedChartData(staffL1Counts, staffL2Counts);

  // Map transitions to records
  const transitions: TransitionRecord[] = Object.entries(transitionCounts)
    .map(([key, count]) => {
      const parts = key.split(' → ');
      return {
        from: parts[0] || '',
        to: parts[1] || '',
        count
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    chartInputStatus,
    chartErrorElement,
    chartErrorCause,
    chartHandling,
    chartStaffL1,
    chartStaffL2,
    chartStaff,
    transitions
  };
}

// Generate styled Excel file using ExcelJS on the client side
export async function exportToExcel(
  records: MergedRecord[],
  stats: any
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phân tích CLL Tự động';
  workbook.lastModifiedBy = 'Phân tích CLL Tự động';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Sheet: Tổng hợp CLL
  const summarySheet = workbook.addWorksheet('Tổng hợp CLL');
  summarySheet.views = [{ showGridLines: true }];

  // Design headers for merged categories
  summarySheet.mergeCells('A1:A2');
  summarySheet.mergeCells('B1:I1');
  summarySheet.mergeCells('J1:Q1');

  summarySheet.getCell('A1').value = 'Số HĐ';
  summarySheet.getCell('B1').value = 'Lần 1 (Báo hỏng)';
  summarySheet.getCell('J1').value = 'Lần 2 (CLPS)';

  // Style category headers
  const headerFillL1 = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F2FF' } // Light Blue
  };
  const headerFillL2 = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0FDF4' } // Light Green
  };

  const borderStyle = {
    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
  };

  // Set category header styling
  ['A1', 'A2'].forEach(ref => {
    const cell = summarySheet.getCell(ref);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const cellB1 = summarySheet.getCell('B1');
  cellB1.fill = headerFillL1 as any;
  cellB1.font = { bold: true, color: { argb: 'FF1E3A8A' } };
  cellB1.alignment = { vertical: 'middle', horizontal: 'center' };

  const cellJ1 = summarySheet.getCell('J1');
  cellJ1.fill = headerFillL2 as any;
  cellJ1.font = { bold: true, color: { argb: 'FF14532D' } };
  cellJ1.alignment = { vertical: 'middle', horizontal: 'center' };

  // Write second row sub-headers
  const l1Headers = [
    'Tg hoàn tất L1',
    'Ghi chú L1',
    'Tình trạng đầu vào L1',
    'Phần tử lỗi L1',
    'Nguyên nhân lỗi L1',
    'Hướng xử lý L1',
    'Nhân viên L1',
    'Trạng thái ghép'
  ];
  
  const l2Headers = [
    'Tg hoàn tất L2',
    'Ghi chú L2',
    'Tình trạng đầu vào L2',
    'Phần tử lỗi L2',
    'Nguyên nhân lỗi L2',
    'Hướng xử lý L2',
    'Nhân viên L2',
    'Chênh lệch (Phút)'
  ];

  l1Headers.forEach((text, index) => {
    const colIndex = index + 2; // B starts at 2
    const cell = summarySheet.getCell(2, colIndex);
    cell.value = text;
    cell.fill = headerFillL1 as any;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  l2Headers.forEach((text, index) => {
    const colIndex = index + 10; // J starts at 10
    const cell = summarySheet.getCell(2, colIndex);
    cell.value = text;
    cell.fill = headerFillL2 as any;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  // Write merged rows
  let currentRowNo = 3;
  for (const record of records) {
    const row = summarySheet.getRow(currentRowNo);
    row.getCell(1).value = record.contractNumber;
    
    row.getCell(2).value = record.completedTimeL1;
    row.getCell(3).value = record.notesL1;
    row.getCell(4).value = record.inputStatusL1;
    row.getCell(5).value = record.errorElementL1;
    row.getCell(6).value = record.errorCauseL1;
    row.getCell(7).value = record.handlingL1;
    row.getCell(8).value = record.staffL1 || '';
    row.getCell(9).value = record.status === 'SUCCESS' ? 'Ghép thành công' : 'Không tìm thấy CLPS';

    row.getCell(10).value = record.completedTimeL2;
    row.getCell(11).value = record.notesL2;
    row.getCell(12).value = record.inputStatusL2;
    row.getCell(13).value = record.errorElementL2;
    row.getCell(14).value = record.errorCauseL2;
    row.getCell(15).value = record.handlingL2;
    row.getCell(16).value = record.staffL2 || '';
    row.getCell(17).value = record.timeDifferenceMinutes !== undefined ? record.timeDifferenceMinutes : '';

    // Bold successfully merged ones or gray out unmatched
    if (record.status !== 'SUCCESS') {
      for (let col = 10; col <= 17; col++) {
        const cell = row.getCell(col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
        cell.font = { italic: true, color: { argb: 'FF9CA3AF' } };
      }
      row.getCell(9).font = { color: { argb: 'FFDC2626' }, bold: true };
    } else {
      row.getCell(9).font = { color: { argb: 'FF16A34A' }, bold: true };
    }

    // Set height and borders
    row.height = 24;
    for (let c = 1; c <= 17; c++) {
      row.getCell(c).border = borderStyle as any;
      if (c === 1) {
        row.getCell(c).font = { bold: true };
      }
    }

    currentRowNo++;
  }

  // Adjust column widths
  summarySheet.columns = [
    { width: 18 }, // A
    { width: 20 }, // B
    { width: 30 }, // C
    { width: 25 }, // D
    { width: 20 }, // E
    { width: 25 }, // F
    { width: 25 }, // G
    { width: 22 }, // H (Nhân viên L1)
    { width: 18 }, // I
    { width: 20 }, // J
    { width: 30 }, // K
    { width: 25 }, // L
    { width: 20 }, // M
    { width: 25 }, // N
    { width: 25 }, // O
    { width: 22 }, // P (Nhân viên L2)
    { width: 18 }  // Q
  ];

  // Helper to standard headings in stat sheets
  const addStatSheet = (sheetName: string, title: string, headers: string[], items: any[], mapFn: (item: any) => any[]) => {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.views = [{ showGridLines: true }];

    // Title
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
    sheet.mergeCells('A1:E1');
    sheet.getRow(1).height = 30;

    // Calculate total sums for percentages
    let totalL1 = 0;
    let totalL2 = 0;
    items.forEach(item => {
      totalL1 += (item['Lần 1'] || 0);
      totalL2 += (item['Lần 2'] || 0);
    });

    const fullHeaders = [...headers, 'Tỷ lệ %'];

    // Table Headers
    const headerRow = sheet.getRow(3);
    headerRow.height = 24;
    fullHeaders.forEach((hName, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = hName;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = borderStyle as any;
    });

    // Data rows
    items.forEach((item, rIdx) => {
      const row = sheet.getRow(rIdx + 4);
      row.height = 22;
      
      const values = mapFn(item);
      const valL1 = item['Lần 1'] || 0;
      const valL2 = item['Lần 2'] || 0;
      
      const pct = valL1 > 0 ? ((valL2 / valL1) * 100).toFixed(2) + '%' : '0%';
      
      const fullValues = [...values, pct];

      fullValues.forEach((val, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = val;
        cell.border = borderStyle as any;
        if (cIdx === 0) {
          cell.font = { bold: true };
        }
      });
    });

    sheet.columns = [
      { width: 35 },
      { width: 18 },
      { width: 18 },
      { width: 15 }
    ];
  };

  // 2. Sheet: Thống kê Tình trạng đầu vào
  addStatSheet(
    'Thống kê Tình trạng đầu vào',
    'Thống Kê Tình Trạng Đầu Vào (Lần 1 & Lần 2)',
    ['Tình trạng đầu vào', 'Số lượng Lần 1', 'Số lượng Lần 2'],
    stats.chartInputStatus,
    (item) => [item.name, item['Lần 1'], item['Lần 2']]
  );

  // 3. Sheet: Thống kê Phần tử lỗi
  addStatSheet(
    'Thống kê Phần tử lỗi',
    'Top Thống Kê Phần Tử Lỗi',
    ['Phần tử lỗi', 'Số lượng Lần 1', 'Số lượng Lần 2'],
    stats.chartErrorElement,
    (item) => [item.name, item['Lần 1'], item['Lần 2']]
  );

  // 4. Sheet: Thống kê Nguyên nhân lỗi
  addStatSheet(
    'Thống kê Nguyên nhân lỗi',
    'Top Thống Kê Nguyên Nhân Lỗi',
    ['Nguyên nhân lỗi', 'Số lượng Lần 1', 'Số lượng Lần 2'],
    stats.chartErrorCause,
    (item) => [item.name, item['Lần 1'], item['Lần 2']]
  );

  // 5. Sheet: Thống kê Hướng xử lý
  addStatSheet(
    'Thống kê Hướng xử lý',
    'Top Thống Kê Hướng Xử Lý',
    ['Hướng xử lý', 'Số lượng Lần 1', 'Số lượng Lần 2'],
    stats.chartHandling,
    (item) => [item.name, item['Lần 1'], item['Lần 2']]
  );

  // 6. Sheet: Top nguyên nhân L1 -> L2
  const transitionSheet = workbook.addWorksheet('Top nguyên nhân L1 → L2');
  transitionSheet.views = [{ showGridLines: true }];

  const tsTitle = transitionSheet.getCell('A1');
  tsTitle.value = 'Mẫu Dịch Chuyển Nguyên Nhân Lỗi (Lần 1 → Lần 2)';
  tsTitle.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
  transitionSheet.mergeCells('A1:D1');
  transitionSheet.getRow(1).height = 30;

  const tsHeader = transitionSheet.getRow(3);
  tsHeader.height = 24;
  const tsHeaders = ['Nguyên nhân lỗi Lần 1', 'Nguyên nhân lỗi Lần 2', 'Số lượng dịch chuyển', 'Tỷ lệ %'];
  
  let totalTransitions = 0;
  stats.transitions.forEach((trans: TransitionRecord) => {
    totalTransitions += trans.count;
  });

  tsHeaders.forEach((hName, idx) => {
    const cell = tsHeader.getCell(idx + 1);
    cell.value = hName;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F2FF' }
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderStyle as any;
  });

  stats.transitions.forEach((trans: TransitionRecord, rIdx: number) => {
    const row = transitionSheet.getRow(rIdx + 4);
    row.height = 22;
    row.getCell(1).value = trans.from;
    row.getCell(2).value = trans.to;
    row.getCell(3).value = trans.count;
    row.getCell(4).value = totalTransitions > 0 ? ((trans.count / totalTransitions) * 100).toFixed(2) + '%' : '0%';

    for (let c = 1; c <= 4; c++) {
      row.getCell(c).border = borderStyle as any;
    }
    row.getCell(1).font = { color: { argb: 'FF374151' } };
    row.getCell(2).font = { color: { argb: 'FF059669' }, bold: true };
    row.getCell(3).font = { bold: true };
    row.getCell(3).alignment = { horizontal: 'center' };
  });

  transitionSheet.columns = [
    { width: 35 },
    { width: 35 },
    { width: 22 },
    { width: 15 }
  ];

  // Write and return buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
