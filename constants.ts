
import { FeeStandardRow, PackagingMaterialRow, InsuranceStandardRow, GeneralFeeStandardRow } from "./types";

// Built-in fallback data for Fee Standards (Example data based on typical logic)
export const DEFAULT_FEE_STANDARD: FeeStandardRow[] = [
  { startProvince: "广东", endProvince: "广东", priceUnder05: 10, price05To1: 11, priceStep: 1 },
  { startProvince: "广东", endProvince: "河南", priceUnder05: 11, price05To1: 12.6, priceStep: 2.1 },
  { startProvince: "广东", endProvince: "上海", priceUnder05: 11, price05To1: 12.6, priceStep: 3.15 },
  { startProvince: "广东", endProvince: "北京", priceUnder05: 12, price05To1: 13.5, priceStep: 4.0 },
  { startProvince: "上海", endProvince: "四川", priceUnder05: 13, price05To1: 15, priceStep: 5.0 },
  { startProvince: "北京", endProvince: "其他", priceUnder05: 10, price05To1: 12, priceStep: 3 },
  // Add more generic defaults or leave empty to encourage upload
];

export const DEFAULT_SPECIAL_FEE_STANDARD: FeeStandardRow[] = [];

// Reflecting the "Shanghai Contract" rules visually for the configuration modal
export const DEFAULT_GENERAL_FEE_STANDARD: GeneralFeeStandardRow[] = [
    { province: "同城(上海)", firstWeight: 1, firstPrice: 8, stepWeight: 1, stepPrice: 2, productType: "标快/特快" },
    { province: "江浙沪", firstWeight: 1, firstPrice: 10, stepWeight: 1, stepPrice: 2, productType: "标快/特快" },
    { province: "偏远(甘青宁新藏)", firstWeight: 1, firstPrice: 20, stepWeight: 1, stepPrice: 10, productType: "标快/特快" },
    { province: "其他异地", firstWeight: 1, firstPrice: 12, stepWeight: 1, stepPrice: 3, productType: "顺丰标快" },
    { province: "其他异地", firstWeight: 1, firstPrice: 16, stepWeight: 1, stepPrice: 5, productType: "顺丰特快" },
];

// Built-in fallback data for Packaging Materials
export const DEFAULT_PACKAGING_TEMPLATE: PackagingMaterialRow[] = [
  { materialName: "F1纸箱", unitPrice: 1.0 },
  { materialName: "F2纸箱", unitPrice: 2.0 },
  { materialName: "F3纸箱", unitPrice: 3.0 },
  { materialName: "F4纸箱", unitPrice: 4.0 },
  { materialName: "F5纸箱", unitPrice: 5.0 },
  { materialName: "F6纸箱", unitPrice: 6.0 },
  { materialName: "防水袋(大)", unitPrice: 0.5 },
  { materialName: "防水袋(中)", unitPrice: 0.3 },
  { materialName: "防水袋(小)", unitPrice: 0.2 },
  { materialName: "气泡膜", unitPrice: 1.5 },
];

// Built-in fallback for Insurance Standards
export const DEFAULT_INSURANCE_STANDARD: InsuranceStandardRow[] = [
  { serviceName: "基础保", rate: 0.01, minFee: 1.0 }, // 1% rate, min 1元
  { serviceName: "足额保", rate: 0.008, minFee: 2.0 }, // 0.8% rate, min 2元
  { serviceName: "保价", rate: 0.01, minFee: 1.0 }, // General fallback
];

export const OUTPUT_HEADERS = [
  "核算类目",
  "运费核算",
  "包装核算",
  "保价核算",
  "核算逻辑",
  "核算金额",
  "差异金额",
  "核对结果",
  "差异原因"
];
