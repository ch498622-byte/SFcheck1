import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, CircleHelp, Check, Loader2 } from 'lucide-react';
import { InsuranceStandardRow } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rules: InsuranceStandardRow[];
  onSave: (rules: InsuranceStandardRow[]) => void;
}

const PRESETS = [
  { name: '基础保', rate: 0.01, min: 1 },
  { name: '足额保', rate: 0.008, min: 2 },
  { name: '保价', rate: 0.01, min: 1 },
];

const InsuranceConfigModal: React.FC<Props> = ({ isOpen, onClose, rules, onSave }) => {
  const [localRules, setLocalRules] = useState<InsuranceStandardRow[]>(rules);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sync state with props when modal opens or props change externally
  useEffect(() => {
    if (isOpen) {
      // Only update local state if it differs from props to prevent cursor jumps/re-renders during auto-save loops
      if (JSON.stringify(rules) !== JSON.stringify(localRules)) {
        setLocalRules(rules);
      }
    }
  }, [rules, isOpen]);

  // Auto-save logic
  useEffect(() => {
    if (!isOpen) return;

    // Check if current local rules are different from what's in props (saved state)
    if (JSON.stringify(localRules) === JSON.stringify(rules)) {
      return;
    }

    setIsSaving(true);
    setLastSaved(null);

    const timer = setTimeout(() => {
      onSave(localRules);
      
      // Artificial delay for UI feedback smoothness
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [localRules, isOpen, rules, onSave]);

  if (!isOpen) return null;

  const handleChange = (index: number, field: keyof InsuranceStandardRow, value: string) => {
    const newRules = [...localRules];
    if (field === 'serviceName') {
      newRules[index] = { ...newRules[index], serviceName: value };
      
      // Auto-fill defaults if user selects a known preset and the current values are 0
      const preset = PRESETS.find(p => p.name === value);
      if (preset && newRules[index].rate === 0) {
          newRules[index].rate = preset.rate;
          newRules[index].minFee = preset.min;
      }
    } else {
      const num = parseFloat(value);
      newRules[index] = { ...newRules[index], [field]: isNaN(num) ? 0 : num };
    }
    setLocalRules(newRules);
  };

  const addRule = () => {
    setLocalRules([...localRules, { serviceName: '', rate: 0, minFee: 0 }]);
  };

  const removeRule = (index: number) => {
    setLocalRules(localRules.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col transform transition-all scale-100">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
             <h3 className="text-xl font-bold text-gray-900">保价费率配置</h3>
             <p className="text-xs text-gray-500 mt-1">配置不同保价服务的费率标准，支持自定义或从预设选择</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex items-start gap-2">
             <CircleHelp className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
             <p className="text-xs text-blue-700 leading-relaxed">
               <strong>匹配说明：</strong> 系统会匹配账单“服务备注”中的关键词。例如配置“足额保”，则备注包含“足额保”的订单将按此费率计算。
             </p>
          </div>

          <datalist id="preset-services">
              {PRESETS.map(p => (
                  <option key={p.name} value={p.name}>{`建议费率 ${(p.rate * 100).toFixed(1)}%`}</option>
              ))}
          </datalist>

          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">服务名称 (关键词)</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">费率</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">最低收费 (元)</th>
                <th className="px-4 py-3 relative"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localRules.map((rule, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      list="preset-services"
                      value={rule.serviceName}
                      onChange={(e) => handleChange(idx, 'serviceName', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm border p-1.5"
                      placeholder="选择或输入..."
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative group">
                        <input 
                          type="number" 
                          step="0.001"
                          value={rule.rate}
                          onChange={(e) => handleChange(idx, 'rate', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm border p-1.5 pr-8"
                        />
                        <span className="absolute right-8 top-1.5 text-xs text-gray-400 pointer-events-none">
                            {(rule.rate * 100).toFixed(1)}%
                        </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      step="1"
                      value={rule.minFee}
                      onChange={(e) => handleChange(idx, 'minFee', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm border p-1.5"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeRule(idx)} className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {localRules.length === 0 && (
                  <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                          暂无规则，请点击下方按钮添加
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
          
          <div className="mt-4 flex flex-wrap gap-2 items-center">
             <button onClick={addRule} className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded hover:bg-blue-50 transition-colors border border-dashed border-blue-200 hover:border-blue-400">
                <Plus className="h-4 w-4 mr-1" />
                添加规则
             </button>
             <span className="text-xs text-gray-400 ml-2 mr-1">快速添加:</span>
             {PRESETS.map(preset => (
                 <button 
                    key={preset.name}
                    onClick={() => setLocalRules([...localRules, { serviceName: preset.name, rate: preset.rate, minFee: preset.min }])}
                    className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 px-3 py-1.5 rounded-full transition-all border border-gray-200 hover:border-blue-200"
                 >
                    + {preset.name}
                 </button>
             ))}
          </div>

        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center rounded-b-xl">
          <div className="flex items-center text-xs text-gray-500 gap-2 min-h-[20px]">
            {isSaving && (
                <span className="flex items-center text-blue-600 animate-pulse">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    自动保存中...
                </span>
            )}
            {!isSaving && lastSaved && (
                <span className="flex items-center text-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    已保存 ({lastSaved.toLocaleTimeString()})
                </span>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center transition-all shadow-md hover:shadow-lg">
                <Check className="h-4 w-4 mr-2" />
                完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceConfigModal;