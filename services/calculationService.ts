
import { BillRow, FeeStandardRow, PackagingMaterialRow, InsuranceStandardRow, ProcessingResult, COL_HEADERS, GeneralFeeStandardRow, BILL_HEADER_ALIASES } from '../types';
import { DEFAULT_GENERAL_FEE_STANDARD } from '../constants';

// --- Province Normalization Logic ---

const PROVINCE_LOOKUP: Record<string, string> = {
  // Standard 2-char & 3-char
  "北京": "北京", "京": "北京", "BEIJING": "北京", "PEKING": "北京",
  "天津": "天津", "津": "天津", "TIANJIN": "天津",
  "河北": "河北", "冀": "河北", "HEBEI": "河北",
  "山西": "山西", "晋": "山西", "SHANXI": "山西",
  "内蒙古": "内蒙古", "内蒙": "内蒙古", "蒙": "内蒙古", "NEIMENGGU": "内蒙古", "INNERMONGOLIA": "内蒙古", "INNER MONGOLIA": "内蒙古",
  "辽宁": "辽宁", "辽": "辽宁", "LIAONING": "辽宁",
  "吉林": "吉林", "吉": "吉林", "JILIN": "吉林",
  "黑龙江": "黑龙江", "黑": "黑龙江", "HEILONGJIANG": "黑龙江",
  "上海": "上海", "沪": "上海", "SHANGHAI": "上海",
  "江苏": "江苏", "苏": "江苏", "JIANGSU": "江苏",
  "浙江": "浙江", "浙": "浙江", "ZHEJIANG": "浙江",
  "安徽": "安徽", "皖": "安徽", "ANHUI": "安徽",
  "福建": "福建", "闽": "福建", "FUJIAN": "福建",
  "江西": "江西", "赣": "江西", "JIANGXI": "江西",
  "山东": "山东", "鲁": "山东", "SHANDONG": "山东",
  "河南": "河南", "豫": "河南", "HENAN": "河南",
  "湖北": "湖北", "鄂": "湖北", "HUBEI": "湖北",
  "湖南": "湖南", "湘": "湖南", "HUNAN": "湖南",
  "广东": "广东", "粤": "广东", "GUANGDONG": "广东", "CAN": "广东",
  "广西": "广西", "桂": "广西", "GUANGXI": "广西",
  "海南": "海南", "琼": "海南", "HAINAN": "海南",
  "重庆": "重庆", "渝": "重庆", "CHONGQING": "重庆",
  "四川": "四川", "川": "四川", "蜀": "四川", "SICHUAN": "四川",
  "贵州": "贵州", "黔": "贵州", "贵": "贵州", "GUIZHOU": "贵州",
  "云南": "云南", "滇": "云南", "云": "云南", "YUNNAN": "云南",
  "西藏": "西藏", "藏": "西藏", "XIZANG": "西藏", "TIBET": "西藏",
  "陕西": "陕西", "陕": "陕西", "秦": "陕西", "SHAANXI": "陕西",
  "甘肃": "甘肃", "甘": "甘肃", "陇": "甘肃", "GANSU": "甘肃",
  "青海": "青海", "青": "青海", "QINGHAI": "青海",
  "宁夏": "宁夏", "宁": "宁夏", "NINGXIA": "宁夏",
  "新疆": "新疆", "新": "新疆", "XINJIANG": "新疆",
  "香港": "香港", "港": "香港", "HK": "香港", "HONGKONG": "香港", "HONG KONG": "香港",
  "澳门": "澳门", "澳": "澳门", "MO": "澳门", "MACAU": "澳门", "MACAO": "澳门",
  "台湾": "台湾", "台": "台湾", "TW": "台湾", "TAIWAN": "台湾",

  // --- Shanghai Districts Mapping ---
  "嘉定": "上海", "浦东": "上海", "闵行": "上海", "松江": "上海", 
  "青浦": "上海", "奉贤": "上海", "金山": "上海", "宝山": "上海", 
  "黄浦": "上海", "徐汇": "上海", "长宁": "上海", "静安": "上海", 
  "普陀": "上海", "虹口": "上海", "杨浦": "上海", "崇明": "上海",

  // --- Key Jiang-Zhe Cities Mapping ---
  "苏州": "江苏", "无锡": "江苏", "常州": "江苏", "南京": "江苏", "昆山": "江苏", "南通": "江苏",
  "杭州": "浙江", "宁波": "浙江", "温州": "浙江", "嘉兴": "浙江", "绍兴": "浙江", "金华": "浙江"
};

const PROVINCE_KEYWORDS = [
  "内蒙古", "黑龙江", "特别行政区", 
  "北京", "天津", "河北", "山西", "辽宁", "吉林", "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州", "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆", "香港", "澳门", "台湾", 
  "内蒙"
];

const normalizeProvince = (str: string) => {
  if (!str) return "";
  let s = str.replace(/\s+/g, '').toUpperCase();
  if (PROVINCE_LOOKUP[s]) return PROVINCE_LOOKUP[s];
  for (const keyword of PROVINCE_KEYWORDS) {
    if (s.includes(keyword)) {
      return PROVINCE_LOOKUP[keyword] || keyword; 
    }
  }
  const cnSuffixes = ["维吾尔自治区", "回族自治区", "壮族自治区", "特别行政区", "自治区", "省", "市", "区", "新区"];
  for (const suffix of cnSuffixes) {
    if (s.endsWith(suffix) && s.length > suffix.length) {
      const stem = s.substring(0, s.length - suffix.length);
      if (PROVINCE_LOOKUP[stem]) return PROVINCE_LOOKUP[stem];
      // Check normalized stem again in case user input "Jiading District" -> "Jiading" -> Lookup
      if (PROVINCE_LOOKUP[stem]) return PROVINCE_LOOKUP[stem];
      return stem;
    }
  }
  return str.trim();
};

const normalize = (str: string) => (str || '').replace(/\s+/g, '').trim();

// Helper to get property from multiple possible keys
const getProp = (row: any, keys: string[]): string => {
    const rowKeys = Object.keys(row);
    // 1. Exact try
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return String(row[k]);
        }
    }
    // 2. Fuzzy key match (simple containment)
    for (const target of keys) {
        const foundKey = rowKeys.find(k => k.includes(target) || target.includes(k));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
            return String(row[foundKey]);
        }
    }
    return "";
}

// SF Verification Logic (Standard)

export const calculateFreight = (
  row: BillRow,
  feeStandards: FeeStandardRow[]
): Partial<ProcessingResult> => {
  const originRaw = getProp(row, [
      COL_HEADERS.ORIGIN_PROVINCE, 
      "始发地(省名)", "始发地", "始发省", "始发城市", "始发地区",
      "原寄地", "原寄省份", "原寄城市", "原寄地区",
      "寄方省份", "寄方", "Start", "Origin"
  ]);
  const destRaw = getProp(row, [COL_HEADERS.DEST_PROVINCE, "目的省", "目的地", "收方省份", "End"]);
  const weightRaw = getProp(row, [COL_HEADERS.WEIGHT, "重量", "Weight", "计费重量"]);
  
  const origin = normalizeProvince(originRaw);
  const dest = normalizeProvince(destRaw);
  const weight = parseFloat(weightRaw || '0');

  // Find all potential matches (either Exact or Wildcard/Fallback)
  const matches = feeStandards.filter((fs) => {
      const fsStart = normalizeProvince(fs.startProvince);
      const fsEnd = normalizeProvince(fs.endProvince);
      
      // Start Condition: Exact Match OR Empty/Wildcard
      const startMatches = fsStart === '' || fsStart === origin;
      
      // End Condition: Exact Match OR '其他' Fallback
      const endMatches = fsEnd === dest || fsEnd === '其他';
      
      return startMatches && endMatches;
  });

  matches.sort((a, b) => {
      const aStartExact = normalizeProvince(a.startProvince) === origin;
      const bStartExact = normalizeProvince(b.startProvince) === origin;
      const aEndExact = normalizeProvince(a.endProvince) === dest;
      const bEndExact = normalizeProvince(b.endProvince) === dest;

      const scoreA = (aStartExact ? 2 : 0) + (aEndExact ? 1 : 0);
      const scoreB = (bStartExact ? 2 : 0) + (bEndExact ? 1 : 0);

      return scoreB - scoreA;
  });

  const standard = matches[0];

  if (!standard) {
    return {
      theoreticalAmount: 0,
      resultText: "未找到运费标准",
      reasonText: `未找到 ${originRaw}(${origin}) 到 ${destRaw}(${dest}) 的报价`,
      freightCalcDetail: `${origin}-${dest} 无报价`,
    };
  }

  let amount = 0;
  let detailFormula = "";

  if (weight <= 0.5) {
    amount = standard.priceUnder05;
    detailFormula = `${amount.toFixed(2)}`;
  } else if (weight <= 1.0) {
    amount = standard.price05To1 || standard.priceUnder05;
    detailFormula = `${amount.toFixed(2)}`;
  } else {
    let basePrice = 0;
    let startWeight = 0;

    if (standard.price05To1 > 0) {
        basePrice = standard.price05To1;
        startWeight = 1.0;
    } else if (standard.priceUnder05 > 0) {
        basePrice = standard.priceUnder05;
        startWeight = 0.5;
    }
    
    const excessWeight = Math.max(0, weight - startWeight);
    const steps = Math.ceil(excessWeight / 0.5);
    
    amount = basePrice + (steps * standard.priceStep);
    detailFormula = `${basePrice} + ${steps} * ${standard.priceStep} = ${amount.toFixed(2)}`;
  }

  amount = Math.round(amount * 100) / 100;

  return {
    theoreticalAmount: amount,
    freightCalcDetail: `${origin}-${dest} ${amount.toFixed(2)}`,
    calculationFormula: detailFormula,
    verificationCategory: "运费",
  };
};

// ... Packaging and Insurance functions remain the same as previous step ...
export const calculatePackaging = (
  row: BillRow,
  packTemplates: PackagingMaterialRow[]
): Partial<ProcessingResult> => {
  const remark = row[COL_HEADERS.SERVICE_REMARK] || '';
  const items = remark.split('|').map(s => s.trim()).filter(s => s.length > 0);
  
  let totalCalc = 0;
  let details: string[] = [];
  let errorReasons: string[] = [];
  let parsedCount = 0;

  for (const itemStr of items) {
    if (itemStr.includes('数量')) {
      const strictMatch = itemStr.match(/([^:|：]+)[:：]数量(\d+)(?:[,，]单价([\d.]+))?/);
      if (strictMatch) {
        const name = strictMatch[1].trim();
        const qty = parseInt(strictMatch[2], 10);
        const billUnitPrice = strictMatch[3] ? parseFloat(strictMatch[3]) : null;
        
        const template = packTemplates.find(p => normalize(p.materialName) === normalize(name));
        
        let unitPriceToUse = 0;
        
        if (template) {
          unitPriceToUse = template.unitPrice;
          if (billUnitPrice !== null && Math.abs(billUnitPrice - template.unitPrice) > 0.01) {
            errorReasons.push(`单价与模板不符(${name}:账单${billUnitPrice}/模板${template.unitPrice})`);
          }
        } else {
           if (billUnitPrice !== null) {
             unitPriceToUse = billUnitPrice;
             errorReasons.push(`模板缺失(${name})`);
           } else {
             errorReasons.push(`未知材料且无单价(${name})`);
           }
        }

        const itemTotal = qty * unitPriceToUse;
        totalCalc += itemTotal;
        details.push(`${name}×${qty}`);
        parsedCount++;
      }
    }
  }

  if (parsedCount === 0 && items.length > 0) {
     return {
         theoreticalAmount: 0,
         resultText: "无法提取包装信息",
         packagingCalcDetail: "解析失败",
     };
  }

  totalCalc = Math.round(totalCalc * 100) / 100;

  return {
    theoreticalAmount: totalCalc,
    packagingCalcDetail: `${details.join('+')} 合计${totalCalc.toFixed(2)}`,
    verificationCategory: "包装材料",
    reasonText: errorReasons.join('; '),
  };
};

export const calculateInsurance = (
  row: BillRow,
  insuranceStandards: InsuranceStandardRow[]
): Partial<ProcessingResult> => {
  const remark = getProp(row, [COL_HEADERS.SERVICE_REMARK, "备注"]);
  const declaredValueStr = getProp(row, [COL_HEADERS.DECLARED_VALUE, "声明价值", "声明价值(元)", "保价金额"]);
  
  if (!declaredValueStr) {
     return {
         theoreticalAmount: 0,
         insuranceCalcDetail: "无声明价值",
         verificationCategory: "保价",
         resultText: "无法核算(缺失声明价值)"
     };
  }

  const declaredValue = parseFloat(declaredValueStr);
  if (isNaN(declaredValue) || declaredValue === 0) {
      return {
         theoreticalAmount: 0,
         insuranceCalcDetail: `声明价值:${declaredValueStr}`,
         verificationCategory: "保价",
         resultText: "声明价值为0"
     };
  }

  const matchedRule = insuranceStandards.find(rule => remark.includes(rule.serviceName)) 
                   || insuranceStandards.find(rule => rule.serviceName === "保价")
                   || (insuranceStandards.length > 0 ? insuranceStandards[0] : undefined);

  if (!matchedRule) {
      return {
         theoreticalAmount: 0,
         insuranceCalcDetail: "无保价标准",
         verificationCategory: "保价",
         reasonText: "未配置保价费率"
     };
  }

  const calcFee = Math.max(declaredValue * matchedRule.rate, matchedRule.minFee);
  const finalFee = Math.round(calcFee * 100) / 100;

  return {
    theoreticalAmount: finalFee,
    insuranceCalcDetail: `${matchedRule.serviceName}(${(matchedRule.rate*100).toFixed(2)}%) 价值${declaredValue}`,
    verificationCategory: "保价",
  };
};

export const processRow = (
  row: BillRow,
  rowNum: number,
  feeStandards: FeeStandardRow[],
  packTemplates: PackagingMaterialRow[],
  insuranceStandards: InsuranceStandardRow[] = []
): ProcessingResult => {
  // ... (SF implementation matches original) ...
  const serviceType = (row[COL_HEADERS.SERVICE_TYPE] || '').trim();
  const payable = parseFloat(row[COL_HEADERS.PAYABLE] || '0');
  const trackingNumber = getProp(row, [COL_HEADERS.TRACKING_NO, "运单号", "单号", "Waybill No", "运单编号"]);
  const originRaw = getProp(row, [
      COL_HEADERS.ORIGIN_PROVINCE, 
      "始发地(省名)", "始发地", "始发省", "始发城市", "始发地区",
      "原寄地", "原寄省份", "原寄城市", "原寄地区",
      "寄方省份", "寄方", "Start", "Origin"
  ]);
  const destRaw = getProp(row, [COL_HEADERS.DEST_PROVINCE, "目的地(省名)", "目的地", "目的省", "收方省份", "End"]);

  let calcResult: Partial<ProcessingResult> = {};

  if (serviceType === '运费') {
    calcResult = calculateFreight(row, feeStandards);
  } else if (serviceType === '包装服务' || serviceType === '包装费') {
    calcResult = calculatePackaging(row, packTemplates);
  } else if (serviceType === '保价') {
    calcResult = calculateInsurance(row, insuranceStandards);
  } else {
    calcResult = {
      theoreticalAmount: payable,
      verificationCategory: serviceType,
      resultText: "未核算服务类型",
    };
  }

  const theoretical = calcResult.theoreticalAmount ?? 0;
  const diff = Math.round((payable - theoretical) * 100) / 100;
  
  let resultText = calcResult.resultText;
  let reasonText = calcResult.reasonText || "";

  if (!resultText) {
    if (Math.abs(diff) < 0.01) {
      resultText = `${calcResult.verificationCategory || serviceType}一致`;
    } else {
      resultText = `${calcResult.verificationCategory || serviceType}差异（账单：${payable.toFixed(2)} vs 核算：${theoretical.toFixed(2)}）`;
      if (!reasonText) reasonText = "金额不一致";
    }
  }

  return {
    rowNum,
    trackingNumber,
    origin: originRaw,
    destination: destRaw,
    verificationCategory: calcResult.verificationCategory || "",
    freightCalcDetail: calcResult.freightCalcDetail || "",
    calculationFormula: calcResult.calculationFormula, // Pass through formula
    packagingCalcDetail: calcResult.packagingCalcDetail || "",
    insuranceCalcDetail: calcResult.insuranceCalcDetail || "",
    theoreticalAmount: theoretical,
    diffAmount: diff,
    resultText: resultText,
    reasonText: reasonText,
  };
};

// --- GENERAL VERIFIER / SHANGHAI CONTRACT LOGIC ---

// Helper to determine region types
const JZH_PROVINCES = ["江苏", "浙江", "上海"];
const REMOTE_PROVINCES = ["新疆", "西藏", "甘肃", "青海"];

/**
 * Priority-based Logic for "Other Express" (Contract Mode).
 * 1. Same City (Origin City == Dest City)
 * 2. JZH (Origin Prov & Dest Prov in JZH)
 * 3. Shanghai -> Remote
 * 4. Others (Rest/Heterogeneous) -> Matches Product Type (Special/Standard) if available
 */
const calculateShanghaiContractFreight = (
    originCity: string,
    destCity: string,
    originProv: string,
    destProv: string,
    productType: string,
    weight: number,
    standards: GeneralFeeStandardRow[]
): Partial<ProcessingResult> => {
    
    let matchedRule: GeneralFeeStandardRow | undefined;
    let matchType = "";

    const isSameCity = (originCity && destCity && originCity === destCity) || 
                       (originProv === "上海" && destProv === "上海"); // Fallback if city data missing but prov is SH

    const isJZH = JZH_PROVINCES.includes(originProv) && JZH_PROVINCES.includes(destProv);
    const isShanghaiOrigin = originProv === "上海";
    const isDestRemote = REMOTE_PROVINCES.includes(destProv);

    // Helper to find rule by keyword in Province Name OR Product Type
    // We prioritize Product Type match if available
    const findRule = (provinceKeywords: string[], productKeyword?: string): GeneralFeeStandardRow | undefined => {
        // Filter by Province Name keywords first
        let candidates = standards.filter(s => provinceKeywords.some(k => s.province.includes(k)));
        
        // If we need to match a specific product type
        if (productKeyword) {
            // Try to find exact product type match within candidates (rule's product type vs bill product type keyword)
            const strictMatch = candidates.find(s => (s.productType || "").includes(productKeyword));
            if (strictMatch) return strictMatch;
            
            // Try to find if the Province Name itself contains the product keyword (e.g. "异地特快")
            const nameMatch = candidates.find(s => s.province.includes(productKeyword));
            if (nameMatch) return nameMatch;

            return undefined; 
        }
        
        return candidates[0];
    };

    if (isSameCity) {
        matchType = "同城";
        matchedRule = findRule(["同城"]);
    } 
    else if (isJZH) {
        matchType = "江浙沪";
        matchedRule = findRule(["江浙沪"]);
    }
    else if (isShanghaiOrigin && isDestRemote) {
        matchType = "偏远(上海发)";
        matchedRule = findRule(["偏远"]);
    }
    else {
        // Heterogeneous / Other Logic ("Rest")
        // Differentiate by Product Type 
        const isSpecial = productType.includes("特快");
        matchType = isSpecial ? "异地特快" : "异地标快";
        
        // Keywords to identify "Other" regions in the config
        const otherKeywords = ["异地", "其他", "Rest", "Other"];
        
        // 1. Try to find a rule that matches both "Other" location AND specific Product Type
        matchedRule = findRule(otherKeywords, isSpecial ? "特快" : "标快");

        // 2. Fallback: If not found, look for rules named explicitly with the product type (e.g. "特快") regardless of "异地" keyword,
        // but exclude known categories like "同城"/"江浙沪" to avoid false positives if user names rule just "特快"
        if (!matchedRule) {
             matchedRule = standards.find(s => 
                s.province.includes(isSpecial ? "特快" : "标快") && 
                !s.province.includes("同城") && 
                !s.province.includes("江浙沪")
             );
        }
        
        // 3. Fallback: If still not found and it's "标快" (Standard), try generic "Other" rule (relaxed match)
        if (!matchedRule && !isSpecial) {
             matchedRule = findRule(otherKeywords);
        }
    }

    if (!matchedRule) {
        return {
            theoreticalAmount: 0,
            resultText: "未找到运费标准",
            reasonText: `满足逻辑[${matchType}]但未在配置中找到对应规则`,
            freightCalcDetail: `${originProv}-${destProv} ${productType} 无报价`,
        };
    }

    // --- Calculation ---
    // Formula: FirstPrice + ceil((Weight - FirstWeight) / StepWeight) * StepPrice
    
    // Safety check for Step Weight to avoid Division by Zero
    const stepWeight = matchedRule.stepWeight > 0 ? matchedRule.stepWeight : 1;
    
    const extraWeight = Math.max(0, weight - matchedRule.firstWeight);
    const steps = Math.ceil(Number((extraWeight / stepWeight).toFixed(6)));
    
    const amount = matchedRule.firstPrice + (steps * matchedRule.stepPrice);
    
    const formula = `${matchedRule.firstPrice} + ${steps} * ${matchedRule.stepPrice} = ${amount.toFixed(2)}`;

    // Create a meaningful category name for the result
    const categoryName = matchedRule.province + (matchedRule.productType ? `(${matchedRule.productType})` : "");

    return {
        theoreticalAmount: Math.round(amount * 100) / 100,
        freightCalcDetail: `${originProv}-${destProv} ${amount.toFixed(2)}`,
        calculationFormula: formula,
        verificationCategory: categoryName,
    };
};

export const calculateGenericTableFreight = (
  row: BillRow,
  feeStandards: GeneralFeeStandardRow[]
): Partial<ProcessingResult> => {
  const originRaw = getProp(row, BILL_HEADER_ALIASES.ORIGIN_PROVINCE);
  const destRaw = getProp(row, BILL_HEADER_ALIASES.DEST_PROVINCE);
  const weightRaw = getProp(row, BILL_HEADER_ALIASES.WEIGHT);
  const serviceTypeRaw = getProp(row, BILL_HEADER_ALIASES.SERVICE_TYPE) || '';
  const serviceType = serviceTypeRaw.trim();
  
  const origin = normalizeProvince(originRaw);
  const dest = normalizeProvince(destRaw);
  const weight = parseFloat(weightRaw || '0');

  // 1. Filter candidates based on geography
  const routeMatches = feeStandards.filter(fs => {
      const fsStart = normalizeProvince(fs.startProvince || '');
      const fsEnd = normalizeProvince(fs.province);
      const startMatches = fsStart === '' || fsStart === origin;
      const endMatches = fsEnd === dest || fsEnd === "默认";
      return startMatches && endMatches;
  });

  if (routeMatches.length === 0) {
    return {
      theoreticalAmount: 0,
      resultText: "未找到运费标准",
      reasonText: `未找到 ${originRaw}->${destRaw} 的报价`,
      freightCalcDetail: `${dest} 无报价`,
    };
  }

  // 2. Intelligent Matching: Prioritize Product Type Match
  let standard: GeneralFeeStandardRow | undefined;
  
  const normServiceType = serviceType.toUpperCase();

  // Filter rules that explicitly have a product type set
  const specificMatches = routeMatches.filter(fs => fs.productType && fs.productType.trim() !== '');

  // Try to find a rule where the defined productType matches the bill's serviceType
  // Logic: Check containment in either direction (Rule contains Bill Type OR Bill Type contains Rule Type)
  standard = specificMatches.find(fs => {
      const fsType = (fs.productType || '').trim().toUpperCase();
      return fsType && (normServiceType.includes(fsType) || fsType.includes(normServiceType));
  });

  // If no strict product match, fallback to a generic rule (empty product type)
  if (!standard) {
      standard = routeMatches.find(fs => !fs.productType || fs.productType.trim() === '');
  }

  // If still no standard found (e.g., all rules have product types but none matched),
  // fallback to the first available geographic match if there's only one, 
  // or default to the first one available to be permissive (legacy behavior).
  if (!standard) {
      standard = routeMatches[0];
  }

  let amount = 0;
  let formula = "";
  
  // Safety check for Step Weight
  const stepWeight = standard.stepWeight > 0 ? standard.stepWeight : 1;

  if (weight <= standard.firstWeight) {
      amount = standard.firstPrice;
      formula = `${amount.toFixed(2)}`;
  } else {
      const extraWeight = weight - standard.firstWeight;
      const steps = Math.ceil(Number((extraWeight / stepWeight).toFixed(6)));
      amount = standard.firstPrice + (steps * standard.stepPrice);
      formula = `${standard.firstPrice} + ${steps} * ${standard.stepPrice} = ${amount.toFixed(2)}`;
  }

  amount = Math.round(amount * 100) / 100;

  // Determine Category Name for display, including product type if specific rule used
  const categorySuffix = (standard.productType && standard.productType.trim() !== '') 
    ? `(${standard.productType})` 
    : "";

  return {
    theoreticalAmount: amount,
    freightCalcDetail: `${origin}-${dest} ${amount.toFixed(2)}`,
    calculationFormula: formula,
    verificationCategory: `运费${categorySuffix}`,
  };
};

export const processGeneralRow = (
  row: BillRow,
  rowNum: number,
  feeStandards: GeneralFeeStandardRow[],
  packTemplates: PackagingMaterialRow[] = [],
  insuranceStandards: InsuranceStandardRow[] = []
): ProcessingResult => {
  const payableRaw = getProp(row, BILL_HEADER_ALIASES.PAYABLE);
  const payable = parseFloat(payableRaw || '0');
  const serviceTypeRaw = getProp(row, BILL_HEADER_ALIASES.SERVICE_TYPE) || '';
  const serviceType = serviceTypeRaw.trim();

  const trackingNumber = getProp(row, BILL_HEADER_ALIASES.TRACKING_NO);
  
  // Extract Location Info
  const originProvRaw = getProp(row, BILL_HEADER_ALIASES.ORIGIN_PROVINCE);
  const destProvRaw = getProp(row, BILL_HEADER_ALIASES.DEST_PROVINCE);
  const originCityRaw = getProp(row, BILL_HEADER_ALIASES.ORIGIN_CITY);
  const destCityRaw = getProp(row, BILL_HEADER_ALIASES.DEST_CITY);

  // Normalize inputs specifically for Logic-Based Calculation
  const originProv = normalizeProvince(originProvRaw);
  const destProv = normalizeProvince(destProvRaw);
  
  // Normalize cities: Remove spaces and try to map if it's a known District (e.g. Jiading -> Shanghai)
  // We use normalizeProvince on the city string too, because PROVINCE_LOOKUP includes district mappings like "嘉定" -> "上海"
  let originCity = (originCityRaw || '').replace(/\s+/g, '').trim();
  let destCity = (destCityRaw || '').replace(/\s+/g, '').trim();
  
  // If user enters "Jiading District", normalizeProvince can catch "Jiading" inside it. 
  // But strictly, we check exact city match for "Same City" logic.
  // We also try to see if the city implies a province (e.g. OriginCity="Suzhou" -> OriginProv="Jiangsu")
  if (!originProv && originCity) {
      const mapped = normalizeProvince(originCity);
      // If mapped is different from original, it's likely a Province (e.g. "Suzhou" -> "Jiangsu") or District
      // This helps populate the province if the excel missed it.
  }

  // Extract Weight
  const weightRaw = getProp(row, BILL_HEADER_ALIASES.WEIGHT);
  const weight = parseFloat(weightRaw || '0');

  let calcResult: Partial<ProcessingResult> = {};

  // 1. Packaging
  if (serviceType.includes('包装') || serviceType.includes('耗材')) {
    calcResult = calculatePackaging(row, packTemplates);
  } 
  // 2. Insurance
  else if (serviceType.includes('保价') || serviceType.includes('保险')) {
    calcResult = calculateInsurance(row, insuranceStandards);
  } 
  // 3. Freight
  else {
    // We prioritize the "Contract Logic" (Same City > JZH > Remote...)
    // This logic relies on having specific keywords ("同城", "江浙沪", "偏远") in the feeStandards.
    // If the feeStandards don't contain these keywords, we might fallback to generic table lookup.
    
    const hasContractKeywords = feeStandards.some(f => 
        f.province.includes("同城") || 
        f.province.includes("江浙沪") || 
        f.province.includes("偏远")
    );

    if (hasContractKeywords) {
         calcResult = calculateShanghaiContractFreight(
             originCity,
             destCity,
             originProv,
             destProv,
             serviceType,
             weight,
             feeStandards
         );
    } else {
         // Fallback: Use standard generic table lookup (Origin -> Dest exact match)
         calcResult = calculateGenericTableFreight(row, feeStandards);
    }

    // Fallback if not obviously freight and calculation failed
    if (serviceType && !serviceType.includes('运费') && !serviceType.includes('费') && !serviceType.includes('标快') && !serviceType.includes('特快')) {
         if (!calcResult.verificationCategory) {
             calcResult.verificationCategory = serviceType;
             calcResult.resultText = "未核算服务类型";
             calcResult.theoreticalAmount = payable; 
         }
    }
  }
  
  const theoretical = calcResult.theoreticalAmount ?? 0;
  const diff = Math.round((payable - theoretical) * 100) / 100;
  
  let resultText = calcResult.resultText;
  let reasonText = calcResult.reasonText || "";

  if (!resultText) {
    if (Math.abs(diff) < 0.01) {
      resultText = `${calcResult.verificationCategory || '运费'}一致`;
    } else {
      resultText = `${calcResult.verificationCategory || '运费'}差异（账单：${payable.toFixed(2)} vs 核算：${theoretical.toFixed(2)}）`;
      if (!reasonText) reasonText = "金额不一致";
    }
  }

  return {
    rowNum,
    trackingNumber,
    origin: originProvRaw || originCityRaw,
    destination: destProvRaw || destCityRaw,
    verificationCategory: calcResult.verificationCategory || "运费",
    freightCalcDetail: calcResult.freightCalcDetail || "",
    calculationFormula: calcResult.calculationFormula, // Pass through formula
    packagingCalcDetail: calcResult.packagingCalcDetail || "",
    insuranceCalcDetail: calcResult.insuranceCalcDetail || "",
    theoreticalAmount: theoretical,
    diffAmount: diff,
    resultText: resultText || "",
    reasonText: reasonText,
  };
};
