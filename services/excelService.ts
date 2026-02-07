
import XLSX from 'xlsx';
import { BillRow, FeeStandardRow, PackagingMaterialRow, InsuranceStandardRow, ProcessingResult, GeneralFeeStandardRow, BILL_HEADER_ALIASES, AggregatedOrder } from '../types';
import { OUTPUT_HEADERS } from '../constants';

export const readExcelFile = <T>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Use 'array' type which is standard for browsers (ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const json = XLSX.utils.sheet_to_json<T>(worksheet, { defval: "" });
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    // Use readAsArrayBuffer for better browser compatibility
    reader.readAsArrayBuffer(file);
  });
};

const safeParseFloat = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  // Remove commas for formatted numbers (e.g. "1,234.56")
  const strVal = String(val).replace(/,/g, '').trim(); 
  if (strVal === '') return 0;
  const parsed = parseFloat(strVal);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper: Normalize keys (remove spaces, uppercase) to find values robustly
// Exported as getSmartCellValue for usage in other services
export const getSmartCellValue = (row: any, candidates: string[]): any => {
  // Create a normalized map of the row's keys once for efficiency if needed, 
  // but for simple rows, iteration is fine.
  const rowKeys = Object.keys(row);
  
  // 1. Try Exact Match First
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== "") return row[c];
  }

  // 2. Fuzzy Match: Normalize row keys and candidates
  // Remove all whitespace, brackets, and convert to uppercase
  const normalize = (s: string) => s.replace(/[\s\(\)（）\[\]]/g, '').toUpperCase();
  const normalizedCandidates = candidates.map(normalize);

  for (const key of rowKeys) {
    const normKey = normalize(key);
    // Check if the normalized key equals any candidate or contains it in a meaningful way
    // We prioritize exact normalized match first
    if (normalizedCandidates.includes(normKey)) {
      return row[key];
    }
  }

  // 3. Loose Containment (e.g. "标准首重费" matches "首重")
  for (const key of rowKeys) {
    const normKey = normalize(key);
    for (const nc of normalizedCandidates) {
      if (normKey.includes(nc)) {
        return row[key];
      }
    }
  }

  return undefined;
};

export const parseFeeStandard = (data: any[]): FeeStandardRow[] => {
  return data.map((row) => ({
    // Enhanced aliases for multi-origin support
    startProvince: getSmartCellValue(row, [
        '始发地(省名)', '始发地', '始发省', '始发城市', '始发地区', '始发',
        '原寄地', '原寄省份', '原寄城市', '原寄地区', '原寄',
        '寄方省份', '寄方城市', '寄方地区', '寄件省份',
        'Start', 'Origin', 'From'
    ]) || '',
    
    endProvince: getSmartCellValue(row, [
        '目的地(省名)', '目的地', '目的省', '目的城市', '目的地区',
        '收方省份', '收方城市', '收方地区', '收件省份',
        'End', 'Dest', 'Destination', 'To',
        '省份', 'Province', '地区', 'Area'
    ]) || '',
    
    priceUnder05: safeParseFloat(
      getSmartCellValue(row, [
        '0<X≤0.5kg运费', '0.5kg内', 'Under0.5', '首重', '首重费', '首重价格', '0-0.5', '<=0.5'
      ])
    ),
    
    price05To1: safeParseFloat(
      getSmartCellValue(row, [
        '0.5<X≤1kg运费', '0.5-1kg', '0.5To1', '1kg内', '<=1', '首重1kg', '基础运费'
      ])
    ),
    
    priceStep: safeParseFloat(
      getSmartCellValue(row, ['续重0.5kg', 'Step', '续重', '续重费', '续重价格', '续重单价'])
    ),
  })).filter(r => r.endProvince); // Allow empty startProvince (treat as wildcard), only require endProvince
};

export const parseGeneralFeeStandard = (data: any[]): GeneralFeeStandardRow[] => {
  return data.map((row) => ({
    startProvince: getSmartCellValue(row, ['始发地', '始发省', 'Start', '原寄地', '寄方省份', 'Origin']),
    province: getSmartCellValue(row, ['目的地', '省份', 'Province', 'Dest', '地区', 'Area', 'Destination']) || '',
    productType: getSmartCellValue(row, ['产品类型', '产品', 'Product Type', 'Service Type', '业务类型']),
    firstWeight: safeParseFloat(getSmartCellValue(row, ['首重', 'FirstWeight', '首重重量'])),
    firstPrice: safeParseFloat(getSmartCellValue(row, ['首重费', 'FirstPrice', '首重价格'])),
    stepWeight: safeParseFloat(getSmartCellValue(row, ['续重', 'StepWeight', '续重重量'])),
    stepPrice: safeParseFloat(getSmartCellValue(row, ['续重费', 'StepPrice', '续重价格'])),
  })).filter(r => r.province);
};

export const parsePackagingTemplate = (data: any[]): PackagingMaterialRow[] => {
  return data.map((row) => ({
    materialName: getSmartCellValue(row, ['物资名称', 'Material', '包装材料', '材料名称']) || '',
    unitPrice: safeParseFloat(getSmartCellValue(row, ['单价', '含税单价', 'Price', '价格'])),
  })).filter(r => r.materialName);
};

export const parseInsuranceStandard = (data: any[]): InsuranceStandardRow[] => {
  return data.map((row) => ({
    serviceName: getSmartCellValue(row, ['服务名称', 'Service', '保价类型', '项目']) || '保价',
    rate: safeParseFloat(getSmartCellValue(row, ['费率', 'Rate', '系数'])),
    minFee: safeParseFloat(getSmartCellValue(row, ['最低收费', 'MinFee', '起步价', '最低价'])),
  })).filter(r => r.rate > 0 || r.minFee > 0);
};

// --- Statistics & Aggregation Logic ---

const isOfflineApprovalRequired = (value: any): boolean => {
  if (!value || typeof value !== 'string') return false;
  const cleanVal = value.trim().replace(/[（）()]/g, '');
  if (cleanVal === '线下审批') return true;
  if (cleanVal.includes('线下') && cleanVal.includes('审批')) return true;
  if (cleanVal.includes('线下') && cleanVal.includes('确认')) return true;
  return false;
};

export const isSummaryRow = (row: BillRow): boolean => {
  const seq = String(getSmartCellValue(row, BILL_HEADER_ALIASES.SEQUENCE) || "").trim().toUpperCase();
  const track = String(getSmartCellValue(row, BILL_HEADER_ALIASES.TRACKING_NO) || "").trim().toUpperCase();
  const keywords = ["合计", "总计", "TOTAL", "SUM", "小计", "SUBTOTAL", "结转", "承前"]; 
  
  if (keywords.some(k => seq.includes(k))) return true;
  if (keywords.some(k => track.includes(k))) return true;
  
  return false;
};

// MODIFIED: Accepts results to use calculated theoreticalAmount for aggregation
export const aggregateOrders = (data: BillRow[], results: ProcessingResult[]): AggregatedOrder[] => {
  const ordersMap = new Map<string, AggregatedOrder>();
  let noTrackingNumCounter = 0;

  data.forEach((row, index) => {
    const result = results[index];
    
    // 1. Identify Tracking Number
    let trackingNo = result ? result.trackingNumber : "";
    if (!trackingNo) {
        trackingNo = String(getSmartCellValue(row, BILL_HEADER_ALIASES.TRACKING_NO) || "").trim();
    }
    
    if (!trackingNo) {
      noTrackingNumCounter++;
      trackingNo = `UNKNOWN_${noTrackingNumCounter}`;
    }

    // 2. Identify Metadata from original row
    const dept = String(getSmartCellValue(row, BILL_HEADER_ALIASES.DEPARTMENT) || "未分类").trim();
    const agent = String(getSmartCellValue(row, BILL_HEADER_ALIASES.AGENT) || "未知").trim();
    const payType = String(getSmartCellValue(row, BILL_HEADER_ALIASES.PAYMENT_TYPE) || "其他").trim();
    const systemMatchVal = getSmartCellValue(row, BILL_HEADER_ALIASES.SYSTEM_MATCH);
    
    // 3. Identify Amount - MODIFIED to use System Calculated Amount
    const amount = result ? result.theoreticalAmount : 0;

    // 4. Check specific offline approval logic
    const requiresApproval = isOfflineApprovalRequired(systemMatchVal);

    if (ordersMap.has(trackingNo)) {
      const existing = ordersMap.get(trackingNo)!;
      existing.totalAmount += amount;
      
      // Update metadata if previous was generic/empty and current is better
      if (existing.department === "未分类" && dept !== "未分类") existing.department = dept;
      if (existing.agent === "未知" && agent !== "未知") existing.agent = agent;
      if (existing.paymentType === "其他" && payType !== "其他") existing.paymentType = payType;
      
      // If any row in the order requires approval, the whole order is flagged
      if (requiresApproval) existing.isOfflineApproval = true;
    } else {
      ordersMap.set(trackingNo, {
        trackingNumber: trackingNo,
        department: dept,
        agent: agent,
        paymentType: payType,
        totalAmount: amount,
        isOfflineApproval: requiresApproval
      });
    }
  });

  return Array.from(ordersMap.values());
};

const generateStatisticsSheets = (orders: AggregatedOrder[], workbook: XLSX.WorkBook) => {
  // Function 1: Department + Payment Type Statistics (Full Data)
  const deptStatsMap = new Map<string, { dept: string, payType: string, count: number, sum: number }>();

  orders.forEach(order => {
    const key = `${order.department}_${order.paymentType}`;
    if (!deptStatsMap.has(key)) {
      deptStatsMap.set(key, { dept: order.department, payType: order.paymentType, count: 0, sum: 0 });
    }
    const entry = deptStatsMap.get(key)!;
    entry.count += 1;
    entry.sum += order.totalAmount;
  });

  const deptStatsData = Array.from(deptStatsMap.values()).map(item => ({
    "部门": item.dept,
    "付款方式": item.payType,
    "订单数量": item.count,
    "总金额": parseFloat(item.sum.toFixed(2))
  }));
  
  // Sort by Department
  deptStatsData.sort((a, b) => a.部门.localeCompare(b.部门));

  if (deptStatsData.length > 0) {
      const sheet = XLSX.utils.json_to_sheet(deptStatsData);
      XLSX.utils.book_append_sheet(workbook, sheet, "部门付款方式统计");
  }

  // Function 2: Offline Approval Details
  const offlineOrders = orders.filter(o => o.isOfflineApproval);
  
  const offlineDetailsData = offlineOrders.map(order => ({
    "经手人": order.agent,
    "运单号": order.trackingNumber,
    "总金额": parseFloat(order.totalAmount.toFixed(2)),
    "付款方式": order.paymentType
  }));

  // Sort by Agent
  offlineDetailsData.sort((a, b) => a.经手人.localeCompare(b.经手人));

  if (offlineDetailsData.length > 0) {
      const sheet = XLSX.utils.json_to_sheet(offlineDetailsData);
      XLSX.utils.book_append_sheet(workbook, sheet, "需线下审批明细");
  } else {
      // Create empty sheet with headers if no data found
      const sheet = XLSX.utils.json_to_sheet([{ "经手人": "", "运单号": "", "总金额": "", "付款方式": "" }], {skipHeader: false});
      XLSX.utils.sheet_add_aoa(sheet, [["经手人", "运单号", "总金额", "付款方式"]], {origin: "A1"});
      XLSX.utils.book_append_sheet(workbook, sheet, "需线下审批明细");
  }

  // Function 3: Offline Approval Stats by Agent + Department
  const offlineStatsMap = new Map<string, { agent: string, dept: string, payType: string, count: number, sum: number }>();
  
  offlineOrders.forEach(order => {
     const key = `${order.agent}_${order.department}_${order.paymentType}`;
     if (!offlineStatsMap.has(key)) {
         offlineStatsMap.set(key, { agent: order.agent, dept: order.department, payType: order.paymentType, count: 0, sum: 0 });
     }
     const entry = offlineStatsMap.get(key)!;
     entry.count += 1;
     entry.sum += order.totalAmount;
  });

  const offlineStatsData = Array.from(offlineStatsMap.values()).map(item => ({
      "经手人": item.agent,
      "部门": item.dept,
      "付款方式": item.payType,
      "订单数量": item.count,
      "总金额": parseFloat(item.sum.toFixed(2))
  }));

  // Sort by Agent then Department
  offlineStatsData.sort((a, b) => {
      const agentDiff = a.经手人.localeCompare(b.经手人);
      if (agentDiff !== 0) return agentDiff;
      return a.部门.localeCompare(b.部门);
  });

  if (offlineStatsData.length > 0) {
      const sheet = XLSX.utils.json_to_sheet(offlineStatsData);
      XLSX.utils.book_append_sheet(workbook, sheet, "线下审批付款方式统计");
  } else {
      const sheet = XLSX.utils.json_to_sheet([]);
      XLSX.utils.sheet_add_aoa(sheet, [["经手人", "部门", "付款方式", "订单数量", "总金额"]], {origin: "A1"});
      XLSX.utils.book_append_sheet(workbook, sheet, "线下审批付款方式统计");
  }
};


export const generateResultExcel = (originalData: BillRow[], results: ProcessingResult[], filenamePrefix: string = "SF_Check_Result"): void => {
  // 1. Create the main Verification Result Sheet
  const mergedData = originalData.map((row, index) => {
    const result = results[index];
    if (!result) return row;

    let amountDisplay = "";
    if (result.calculationFormula) {
        amountDisplay = result.calculationFormula;
    } else if (!(result.resultText === "未找到运费标准" && result.theoreticalAmount === 0)) {
        amountDisplay = result.theoreticalAmount.toFixed(2);
    }

    return {
      ...row,
      [OUTPUT_HEADERS[0]]: result.verificationCategory,
      [OUTPUT_HEADERS[1]]: result.freightCalcDetail,
      [OUTPUT_HEADERS[2]]: result.packagingCalcDetail,
      [OUTPUT_HEADERS[3]]: result.insuranceCalcDetail,
      [OUTPUT_HEADERS[4]]: amountDisplay, // 核算逻辑 (was 核算金额)
      [OUTPUT_HEADERS[5]]: result.theoreticalAmount.toFixed(2), // 核算金额 (was 核算金额2)
      [OUTPUT_HEADERS[6]]: result.diffAmount.toFixed(2),
      [OUTPUT_HEADERS[7]]: result.resultText,
      [OUTPUT_HEADERS[8]]: result.reasonText,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(mergedData);
  
  // 2. Add Summary Row for Calculated Amounts
  if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Calculate Totals - EXCLUDING original summary rows
      // We filter out original summary rows to avoid double counting and huge differences in "Diff Amount"
      const validIndices: number[] = [];
      originalData.forEach((row, idx) => {
          if (!isSummaryRow(row)) {
              validIndices.push(idx);
          }
      });

      const totalTheoretical = validIndices.reduce((sum, idx) => {
          const r = results[idx];
          return sum + (r ? r.theoreticalAmount : 0);
      }, 0);
      
      const totalDiff = validIndices.reduce((sum, idx) => {
          const r = results[idx];
          return sum + (r ? r.diffAmount : 0);
      }, 0);
      
      // Find columns for "核算金额" and "差异金额"
      const headerRowIndex = range.s.r;
      let amountColIdx = -1;
      let diffColIdx = -1;
      
      // OUTPUT_HEADERS[5] is "核算金额", OUTPUT_HEADERS[6] is "差异金额"
      const amountHeader = OUTPUT_HEADERS[5];
      const diffHeader = OUTPUT_HEADERS[6];

      for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({c: C, r: headerRowIndex});
          const cell = worksheet[cellRef];
          if (cell && cell.v === amountHeader) amountColIdx = C;
          if (cell && cell.v === diffHeader) diffColIdx = C;
      }

      // Add Summary Row if Amount Column found
      if (amountColIdx !== -1) {
          const summaryRowIndex = range.e.r + 1;
          
          // Add "总计" label to the left of Amount column if possible
          if (amountColIdx > 0) {
               const labelRef = XLSX.utils.encode_cell({c: amountColIdx - 1, r: summaryRowIndex});
               worksheet[labelRef] = { t: 's', v: '总计' };
               if(!worksheet[labelRef].s) worksheet[labelRef].s = {};
               worksheet[labelRef].s.font = { bold: true };
               worksheet[labelRef].s.alignment = { horizontal: "right" };
          }

          // Add Total Amount
          const amountRef = XLSX.utils.encode_cell({c: amountColIdx, r: summaryRowIndex});
          worksheet[amountRef] = { t: 'n', v: totalTheoretical, z: '0.00' };
          if(!worksheet[amountRef].s) worksheet[amountRef].s = {};
          worksheet[amountRef].s.font = { bold: true };
          worksheet[amountRef].s.fill = { fgColor: { rgb: "FFFFCC" } }; // Light Yellow

          // Add Total Diff
          if (diffColIdx !== -1) {
              const diffRef = XLSX.utils.encode_cell({c: diffColIdx, r: summaryRowIndex});
              worksheet[diffRef] = { t: 'n', v: totalDiff, z: '0.00' };
              if(!worksheet[diffRef].s) worksheet[diffRef].s = {};
              worksheet[diffRef].s.font = { bold: true, color: { rgb: totalDiff !== 0 ? "FF0000" : "008000" } };
          }
          
          // Extend Worksheet Range
          range.e.r = summaryRowIndex;
          worksheet['!ref'] = XLSX.utils.encode_range(range);
      }
  }

  // 3. Highlighting Logic (Requires xlsx-js-style)
  // We use the decoded range to iterate all data rows
  if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      // Note: loop goes up to range.e.r. If we added a summary row, range.e.r is now higher.
      // But results[dataIndex] will be undefined for the summary row, so checks below safely fail and skip highlighting.
      for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Skip header row (R=0)
          const dataIndex = R - 1;
          const res = results[dataIndex];
          
          // If result exists and has difference OR error (excluding "一致" cases)
          if (res && (Math.abs(res.diffAmount) > 0.01 || res.resultText.includes("未找到") || res.resultText.includes("差异") || res.resultText.includes("无法"))) {
              // Iterate over all columns in this row to set background
              for (let C = range.s.c; C <= range.e.c; ++C) {
                  const cell_ref = XLSX.utils.encode_cell({c: C, r: R});
                  if (!worksheet[cell_ref]) continue;
                  
                  // Apply Style
                  (worksheet[cell_ref] as any).s = {
                      fill: { fgColor: { rgb: "FFE4E1" } }, // Misty Rose (Light Red)
                      font: { color: { rgb: "8B0000" } }    // Dark Red Text
                  };
              }
          }
      }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "核对结果");
  
  // 4. Perform Statistics and append new sheets
  try {
      console.log("Starting statistical analysis...");
      
      // Filter out summary rows from the aggregation data
      const validDataIndices = originalData.map((row, idx) => ({row, idx})).filter(({row}) => !isSummaryRow(row));
      
      const filteredData = validDataIndices.map(x => x.row);
      const filteredResults = validDataIndices.map(x => results[x.idx]);

      // Pass filtered results to aggregateOrders so it aggregates only valid orders
      const aggregatedOrders = aggregateOrders(filteredData, filteredResults);
      generateStatisticsSheets(aggregatedOrders, workbook);
      console.log("Statistical analysis completed.");
  } catch (error) {
      console.error("Error generating statistics sheets:", error);
  }

  // 5. Generate filename with timestamp
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  XLSX.writeFile(workbook, `${filenamePrefix}_${timestamp}.xlsx`);
};
