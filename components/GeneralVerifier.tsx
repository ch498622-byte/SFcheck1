
import React, { useState } from 'react';
import { Play, Download, AlertCircle, CheckCircle, FileText, AlertTriangle, XCircle, Check, ArrowRight, Truck, Settings, Package, CreditCard, UserCog, CircleDollarSign } from 'lucide-react';
import FileUpload from './FileUpload';
import GeneralFeeConfigModal from './GeneralFeeConfigModal';
import InsuranceConfigModal from './InsuranceConfigModal';
import { readExcelFile, getSmartCellValue, parseGeneralFeeStandard, parsePackagingTemplate, generateResultExcel, aggregateOrders, isSummaryRow } from '../services/excelService';
import { processGeneralRow } from '../services/calculationService';
import { DEFAULT_GENERAL_FEE_STANDARD, DEFAULT_PACKAGING_TEMPLATE, DEFAULT_INSURANCE_STANDARD } from '../constants';
import { GeneralFeeStandardRow, BillRow, ProcessingResult, CalculationStats, BILL_HEADER_ALIASES, PackagingMaterialRow, InsuranceStandardRow } from '../types';

const GeneralVerifier: React.FC = () => {
  const [billFile, setBillFile] = useState<File | null>(null);
  const [feeFile, setFeeFile] = useState<File | null>(null);
  const [packFile, setPackFile] = useState<File | null>(null);
  
  // Rules State
  const [feeRules, setFeeRules] = useState<GeneralFeeStandardRow[]>(DEFAULT_GENERAL_FEE_STANDARD);
  const [insuranceRules, setInsuranceRules] = useState<InsuranceStandardRow[]>(DEFAULT_INSURANCE_STANDARD);
  
  // Modal State
  const [isFeeConfigOpen, setIsFeeConfigOpen] = useState(false);
  const [isInsuranceConfigOpen, setIsInsuranceConfigOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CalculationStats | null>(null);
  const [processedResults, setProcessedResults] = useState<{data: BillRow[], results: ProcessingResult[]} | null>(null);

  const handleFeeFileSelect = async (file: File | null) => {
      setFeeFile(file);
      if (file) {
          try {
              const rawFeeData = await readExcelFile<any>(file);
              const parsed = parseGeneralFeeStandard(rawFeeData);
              if (parsed.length > 0) {
                  setFeeRules(parsed);
              }
          } catch (e) {
              console.error("Failed to parse fee file", e);
          }
      }
  };

  const handleProcess = async () => {
    if (!billFile) {
      setError("请上传快递账单文件");
      return;
    }
    if (feeRules.length === 0) {
        setError("请上传运费收费标准或手动配置费率规则");
        return;
    }

    setIsProcessing(true);
    setError(null);
    setStats(null);
    setProcessedResults(null);

    try {
      // 1. Fee Standards are in state (feeRules)
      
      // 2. Load Packaging Templates
      let packTemplates: PackagingMaterialRow[] = DEFAULT_PACKAGING_TEMPLATE;
      if (packFile) {
        const rawPackData = await readExcelFile<any>(packFile);
        packTemplates = parsePackagingTemplate(rawPackData);
      }

      // 3. Insurance Rules are in state (insuranceRules)

      // 4. Load Bill
      const billData = await readExcelFile<BillRow>(billFile);
      
      if (!billData || billData.length === 0) {
        throw new Error("账单文件为空或无法解析");
      }

      const results: ProcessingResult[] = [];
      let mismatchCount = 0;
      let errorCount = 0;

      billData.forEach((row, index) => {
        if (Object.keys(row).length === 0) return;

        try {
          const result = processGeneralRow(row, index + 2, feeRules, packTemplates, insuranceRules);
          results.push(result);
          
          if (result.resultText.includes("差异") || result.resultText.includes("未找到")) {
            mismatchCount++;
          }
        } catch (e) {
          errorCount++;
          console.error(`Row ${index} processing error`, e);
        }
      });

      setProcessedResults({ data: billData, results });
      
      // Calculate Stats using aggregation logic
      const validDataIndices = billData.map((row, idx) => ({row, idx})).filter(({row}) => !isSummaryRow(row));
      const filteredData = validDataIndices.map(x => x.row);
      const filteredResults = validDataIndices.map(x => results[x.idx]);

      const aggregatedOrders = aggregateOrders(filteredData, filteredResults);
      
      const totalOrders = aggregatedOrders.length;
      const prepaidCount = aggregatedOrders.filter(o => o.paymentType.includes("寄付")).length;
      const collectCount = aggregatedOrders.filter(o => o.paymentType.includes("到付")).length;
      const offlineApprovalCount = aggregatedOrders.filter(o => o.isOfflineApproval).length;
      const totalDiffAmount = filteredResults.reduce((acc, r) => acc + r.diffAmount, 0);

      setStats({
        totalRows: results.length,
        matchedRows: results.length - mismatchCount - errorCount,
        mismatchedRows: mismatchCount,
        errorRows: errorCount,
        totalOrders,
        prepaidCount,
        collectCount,
        offlineApprovalCount,
        totalDiffAmount
      });

    } catch (err: any) {
      setError(err.message || "处理过程发生未知错误");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedResults) return;
    try {
      generateResultExcel(processedResults.data, processedResults.results, "General_Result");
    } catch (err: any) {
      setError("导出文件失败: " + err.message);
    }
  };

  const getBillAmount = (rowNum: number): string => {
      if (!processedResults) return "0.00";
      const idx = processedResults.results.findIndex(r => r.rowNum === rowNum);
      if (idx === -1) return "-";
      const row = processedResults.data[idx];
      const val = getSmartCellValue(row, BILL_HEADER_ALIASES.PAYABLE);
      return parseFloat(val || 0).toFixed(2);
  }

  return (
    <div className="flex flex-col gap-8 w-full">
        <GeneralFeeConfigModal 
            isOpen={isFeeConfigOpen}
            onClose={() => setIsFeeConfigOpen(false)}
            rules={feeRules}
            onSave={setFeeRules}
        />
        
        <InsuranceConfigModal 
            isOpen={isInsuranceConfigOpen} 
            onClose={() => setIsInsuranceConfigOpen(false)} 
            rules={insuranceRules}
            onSave={setInsuranceRules}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">1</span>
                <h2 className="text-lg font-semibold text-gray-900">上传文件</h2>
              </div>
              
              <FileUpload 
                label="快递账单 (必须)" 
                file={billFile} 
                onFileSelect={setBillFile} 
                required 
                description="包含: 运单号, 目的地, 计费重量, 应付金额"
              />

              <div className="my-5 space-y-4">
                <FileUpload 
                    label="收费标准 (可选)" 
                    file={feeFile} 
                    onFileSelect={handleFeeFileSelect}
                    description="上传Excel文件覆盖当前规则"
                />
                
                <FileUpload 
                    label="包装材料模板 (可选)" 
                    file={packFile} 
                    onFileSelect={setPackFile}
                    description="覆盖默认包装单价"
                />

                <div className="space-y-3 pt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">运费规则</label>
                        <button 
                            onClick={() => setIsFeeConfigOpen(true)}
                            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:border-purple-400 hover:shadow-sm transition-all group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-md group-hover:bg-purple-100 transition-colors">
                                    <Settings className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-purple-700">手动配置费率</p>
                                    <p className="text-xs text-gray-500">当前已生效 {feeRules.length} 条规则</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">保价规则</label>
                        <button 
                            onClick={() => setIsInsuranceConfigOpen(true)}
                            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:border-purple-400 hover:shadow-sm transition-all group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-md group-hover:bg-purple-100 transition-colors">
                                    <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-purple-700">配置保价费率</p>
                                    <p className="text-xs text-gray-500">当前已生效 {insuranceRules.length} 条规则</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
              </div>

              <button
                onClick={handleProcess}
                disabled={!billFile || feeRules.length === 0 || isProcessing}
                className={`w-full group relative flex items-center justify-center py-3.5 px-4 rounded-lg text-white font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                  ${!billFile || feeRules.length === 0 || isProcessing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在计算中...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2 fill-purple-500/20 group-hover:fill-purple-500/40 transition-colors" />
                    开始核算 (通用)
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl animate-fade-in shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">错误</h3>
                    <div className="mt-1 text-sm text-red-600">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
                <strong>提示:</strong> 支持上传Excel或手动录入费率规则。通用模式下，亦可自动核算包装费与保价费。
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px] flex flex-col transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">2</span>
                    <h2 className="text-lg font-semibold text-gray-900">核对概览</h2>
                 </div>
                 {stats && (
                     <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                         已完成
                     </span>
                 )}
              </div>
              
              {!stats ? (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30 m-4">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <FileText className="h-10 w-10 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-500">等待数据</p>
                  <p className="text-sm text-gray-400 mt-1">请上传文件并开始核算</p>
                </div>
              ) : (
                <div className="flex flex-col h-full animate-fade-in">
                  
                  {/* Business Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* Total Orders */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                       <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">快递单数</p>
                         <p className="text-xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
                       </div>
                       <div className="bg-blue-50 p-2.5 rounded-lg"><Package className="h-5 w-5 text-blue-600"/></div>
                    </div>
                    {/* Payment Types */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                       <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">付款方式</p>
                         <div className="flex gap-2 mt-1.5">
                            <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">寄付 {stats.prepaidCount}</span>
                            <span className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-medium">到付 {stats.collectCount}</span>
                         </div>
                       </div>
                       <div className="bg-indigo-50 p-2.5 rounded-lg"><CreditCard className="h-5 w-5 text-indigo-600"/></div>
                    </div>
                    {/* Offline Approval */}
                    <div className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between ${stats.offlineApprovalCount > 0 ? 'border-orange-200 bg-orange-50/20' : 'border-gray-200'}`}>
                       <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">需线下审批</p>
                         <p className={`text-xl font-bold mt-1 ${stats.offlineApprovalCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{stats.offlineApprovalCount}</p>
                       </div>
                       <div className={`${stats.offlineApprovalCount > 0 ? 'bg-orange-100' : 'bg-gray-100'} p-2.5 rounded-lg`}>
                          <UserCog className={`h-5 w-5 ${stats.offlineApprovalCount > 0 ? 'text-orange-600' : 'text-gray-500'}`}/>
                       </div>
                    </div>
                     {/* Total Diff */}
                    <div className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between ${Math.abs(stats.totalDiffAmount) > 0.1 ? 'border-red-200 bg-red-50/20' : 'border-green-200 bg-green-50/20'}`}>
                       <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">总核对差异</p>
                         <p className={`text-xl font-bold mt-1 ${Math.abs(stats.totalDiffAmount) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                           {stats.totalDiffAmount > 0 ? '+' : ''}{stats.totalDiffAmount.toFixed(2)}
                         </p>
                       </div>
                       <div className={`${Math.abs(stats.totalDiffAmount) > 0.1 ? 'bg-red-100' : 'bg-green-100'} p-2.5 rounded-lg`}>
                          <CircleDollarSign className={`h-5 w-5 ${Math.abs(stats.totalDiffAmount) > 0.1 ? 'text-red-600' : 'text-green-600'}`}/>
                       </div>
                    </div>
                  </div>

                  {/* Verification Status Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <FileText className="h-12 w-12 text-purple-600" />
                      </div>
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">总行数</p>
                      <p className="text-2xl font-extrabold text-purple-900">{stats.totalRows}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <CheckCircle className="h-12 w-12 text-green-600" />
                      </div>
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">完全一致</p>
                      <p className="text-2xl font-extrabold text-green-900">{stats.matchedRows}</p>
                    </div>
                    
                    <div className={`bg-gradient-to-br from-orange-50 to-white p-4 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden group ${stats.mismatchedRows > 0 ? 'ring-2 ring-orange-200 ring-offset-1' : ''}`}>
                       <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <AlertCircle className="h-12 w-12 text-orange-600" />
                      </div>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">存在差异</p>
                      <p className="text-2xl font-extrabold text-orange-900">{stats.mismatchedRows}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                       <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <AlertTriangle className="h-12 w-12 text-gray-600" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">处理异常</p>
                      <p className="text-2xl font-extrabold text-gray-700">{stats.errorRows}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                        差异详情概览
                        <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            显示前 {Math.min(stats.mismatchedRows, 50)} 项
                        </span>
                    </h3>
                  </div>

                  <div className="flex-grow bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden flex flex-col mb-6">
                    <div className="overflow-y-auto max-h-[400px] p-4 space-y-3 custom-scrollbar">
                      {processedResults?.results
                        .filter(r => Math.abs(r.diffAmount) >= 0.01 || r.resultText.includes("未找到") || r.resultText.includes("差异"))
                        .slice(0, 50)
                        .map((res, idx) => (
                          <div key={idx} className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all p-3 border-l-4 ${
                              res.diffAmount > 0.01 ? 'border-l-red-500 border-gray-100' : 
                              res.diffAmount < -0.01 ? 'border-l-green-500 border-gray-100' : 'border-l-gray-300 border-gray-100'
                          }`}>
                              
                              <div className="flex justify-between items-start mb-2">
                                  <div className="min-w-0 flex-1 mr-2">
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-mono">#{res.rowNum}</span>
                                          <span className="font-bold text-gray-900 text-sm truncate select-all">{res.trackingNumber || "无单号"}</span>
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-gray-500">
                                          {(res.origin || res.destination) && (
                                              <div className="flex items-center bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                  <span className="truncate max-w-[60px]">{res.origin || "?"}</span>
                                                  <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                                                  <span className="truncate max-w-[60px]">{res.destination || "?"}</span>
                                              </div>
                                          )}
                                          <span className="text-gray-300">|</span>
                                          <span>{res.verificationCategory}</span>
                                      </div>
                                  </div>

                                  <div className={`flex flex-col items-end flex-shrink-0`}>
                                       <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                           res.diffAmount > 0.01 ? 'bg-red-50 text-red-700' : 
                                           res.diffAmount < -0.01 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                       }`}>
                                          {res.diffAmount > 0.01 ? '多付' : (res.diffAmount < -0.01 ? '少付' : '一致')} 
                                          {Math.abs(res.diffAmount).toFixed(2)}
                                       </span>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded overflow-hidden mb-2">
                                  <div className="bg-white p-2 flex flex-col items-center">
                                       <span className="text-[10px] text-gray-400 uppercase tracking-wider">账单金额</span>
                                       <span className="font-semibold text-gray-900">{getBillAmount(res.rowNum)}</span>
                                  </div>
                                  <div className="bg-white p-2 flex flex-col items-center">
                                       <span className="text-[10px] text-gray-400 uppercase tracking-wider">系统核算</span>
                                       <span className="font-bold text-purple-600">{res.theoreticalAmount.toFixed(2)}</span>
                                  </div>
                              </div>

                              <div className="bg-gray-50 rounded p-2 text-xs text-gray-600 leading-relaxed border border-gray-100">
                                  {res.calculationFormula && (
                                      <div className="mb-1 font-mono text-[10px] text-gray-500 border-b border-gray-200 pb-1">
                                         算式: {res.calculationFormula}
                                      </div>
                                  )}
                                  <div className="flex items-start gap-1.5">
                                       <AlertCircle className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${res.resultText.includes("未找到") ? "text-orange-500" : "text-gray-400"}`} />
                                       <span>
                                         {res.reasonText && res.reasonText !== "金额不一致" ? res.reasonText : 
                                          (res.resultText || res.freightCalcDetail)}
                                       </span>
                                  </div>
                              </div>
                          </div>
                        ))}
                      
                      {stats.mismatchedRows === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <div className="bg-green-100 p-3 rounded-full mb-3">
                              <Check className="h-8 w-8 text-green-600" />
                          </div>
                          <p className="font-medium text-gray-900">太棒了！</p>
                          <p className="text-sm">没有发现任何金额差异</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full mt-auto flex items-center justify-center py-4 px-4 rounded-xl text-white font-bold bg-green-600 hover:bg-green-700 active:bg-green-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    下载完整核对结果 (.xlsx)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

function ShieldCheckIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

export default GeneralVerifier;
