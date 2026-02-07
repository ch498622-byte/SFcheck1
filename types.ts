
export interface FeeStandardRow {
  startProvince: string;
  endProvince: string;
  priceUnder05: number; // <= 0.5kg
  price05To1: number;   // 0.5 < x <= 1kg
  priceStep: number;    // 0.5kg step price
}

export interface GeneralFeeStandardRow {
  startProvince?: string; // Optional, defaults to ignoring or "Any"
  province: string;       // Destination
  firstWeight: number;
  firstPrice: number;
  stepWeight: number;
  stepPrice: number;
  productType?: string; // Added to support "特快" vs "标快"
}

export interface PackagingMaterialRow {
  materialName: string;
  unitPrice: number;
}

export interface InsuranceStandardRow {
  serviceName: string; // e.g., "基础保", "足额保"
  rate: number;        // e.g., 0.01 for 1%
  minFee: number;      // e.g., 1.0
}

export interface BillRow {
  __rowNum__: number; // Internal row number from Excel
  [key: string]: any; // Allow dynamic access for reading original columns
}

export interface ProcessingResult {
  rowNum: number;
  trackingNumber: string; // 运单号
  origin: string;         // 始发地
  destination: string;    // 目的地
  verificationCategory: string; // 核算类目
  freightCalcDetail: string;    // 运费核算 (显示: 路径 + 金额)
  calculationFormula?: string;  // 计算公式 (显示: 具体算式)
  packagingCalcDetail: string;  // 包装核算
  insuranceCalcDetail: string;  // 保价核算
  theoreticalAmount: number;    // 核算金额 (数值, 用于计算差异)
  diffAmount: number;           // 差异金额
  resultText: string;           // 核对结果
  reasonText: string;           // 差异原因
}

export interface AggregatedOrder {
  trackingNumber: string;
  department: string;
  agent: string;
  paymentType: string;
  totalAmount: number;
  isOfflineApproval: boolean;
}

export interface CalculationStats {
  totalRows: number;
  matchedRows: number;
  mismatchedRows: number;
  errorRows: number;
  // Business Stats
  totalOrders: number;
  prepaidCount: number;
  collectCount: number;
  offlineApprovalCount: number;
  totalDiffAmount: number;
}

export const COL_HEADERS = {
  SEQUENCE: "序号",
  TRACKING_NO: "运单号",
  WEIGHT: "计费重量",
  FEE: "费用(元)",
  PAYABLE: "应付金额",
  SERVICE_TYPE: "服务",
  SERVICE_REMARK: "服务备注",
  ORIGIN_PROVINCE: "始发地(省名)",
  DEST_PROVINCE: "目的地(省名)",
  DECLARED_VALUE: "声明价值",
};

export const BILL_HEADER_ALIASES = {
  SEQUENCE: ["序号", "No", "Sequence"],
  TRACKING_NO: ["运单号", "单号", "Waybill No", "运单编号"],
  WEIGHT: ["计费重量", "重量", "Weight", "Chargeable Weight"],
  FEE: ["费用(元)", "运费", "Freight"],
  PAYABLE: ["应付金额", "应付", "Total Amount", "折扣后应付金额", "费用", "金额"],
  SERVICE_TYPE: ["服务", "产品类型", "Product Type", "业务类型", "费用类型"],
  SERVICE_REMARK: ["服务备注", "备注", "Remark"],
  ORIGIN_PROVINCE: ["始发地(省名)", "始发地", "原寄地", "寄方省份", "始发省", "Start"],
  DEST_PROVINCE: ["目的地(省名)", "目的地", "目的省", "收方省份", "End"],
  ORIGIN_CITY: ["寄件地区", "始发城市", "原寄城市", "Start City"],
  DEST_CITY: ["到件地区", "目的城市", "收方城市", "Dest City"],
  DECLARED_VALUE: ["声明价值", "声明价值(元)", "保价金额"],
  // New aliases for statistics
  DEPARTMENT: ["部门", "成本中心", "Department", "Dept", "所属部门"],
  PAYMENT_TYPE: ["付款方式", "结算方式", "Payment Type", "Pay Type"],
  AGENT: ["经手人", "负责人", "申请人", "Agent", "User", "寄件人"],
  SYSTEM_MATCH: ["系统匹配", "匹配结果", "System Match", "匹配备注"]
};
