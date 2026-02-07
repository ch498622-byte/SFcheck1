
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { GeneralFeeStandardRow } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rules: GeneralFeeStandardRow[];
  onSave: (rules: GeneralFeeStandardRow[]) => void;
}

const GeneralFeeConfigModal: React.FC<Props> = ({ isOpen, onClose, rules, onSave }) => {
  const [localRules, setLocalRules] = useState<GeneralFeeStandardRow[]>(rules);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (JSON.stringify(rules) !== JSON.stringify(localRules)) {
        setLocalRules(rules);
      }
    }
  }, [rules, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (JSON.stringify(localRules) === JSON.stringify(rules)) return;

    setIsSaving(true);
    setLastSaved(null);

    const timer = setTimeout(() => {
      onSave(localRules);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 1000);

    return () => clearTimeout(timer);
  }, [localRules, isOpen, rules, onSave]);

  if (!isOpen) return null;

  const handleChange = (index: number, field: keyof GeneralFeeStandardRow, value: string) => {
    const newRules = [...localRules];
    if (field === 'province' || field === 'startProvince' || field === 'productType') {
      newRules[index] = { ...newRules[index], [field]: value };
    } else {
      const num = parseFloat(value);
      newRules[index] = { ...newRules[index], [field]: isNaN(num) ? 0 : num };
    }
    setLocalRules(newRules);
  };

  const addRule = () => {
    setLocalRules([...localRules, { startProvince: '', province: '', productType: '', firstWeight: 1, firstPrice: 0, stepWeight: 1, stepPrice: 0 }]);
  };

  const removeRule = (index: number) => {
    setLocalRules(localRules.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[85vh] flex flex-col transform transition-all scale-100">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
             <h3 className="text-xl font-bold text-gray-900">通用快递费率配置</h3>
             <p className="text-xs text-gray-500 mt-1">配置各流向及产品类型的价格标准</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">始发地 (可选)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">目的地 (省/区)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">产品类型 (可选)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">首重 (kg)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">首重费 (元)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">续重 (kg)</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">续重费 (元)</th>
                <th className="px-3 py-3 relative"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localRules.map((rule, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3">
                    <input 
                      type="text" 
                      value={rule.startProvince || ''}
                      onChange={(e) => handleChange(idx, 'startProvince', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm border p-1.5"
                      placeholder="任意"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input 
                      type="text" 
                      value={rule.province}
                      onChange={(e) => handleChange(idx, 'province', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm border p-1.5"
                      placeholder="如: 广东"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input 
                      type="text" 
                      value={rule.productType || ''}
                      onChange={(e) => handleChange(idx, 'productType', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm border p-1.5"
                      placeholder="如: 特快"
                    />
                  </td>
                  <td className="px-3 py-3">
                     <input 
                      type="number" step="0.5"
                      value={rule.firstWeight}
                      onChange={(e) => handleChange(idx, 'firstWeight', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm border p-1.5 w-20"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input 
                      type="number" step="0.5"
                      value={rule.firstPrice}
                      onChange={(e) => handleChange(idx, 'firstPrice', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm border p-1.5 w-24"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input 
                      type="number" step="0.5"
                      value={rule.stepWeight}
                      onChange={(e) => handleChange(idx, 'stepWeight', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm border p-1.5 w-20"
                    />
                  </td>
                   <td className="px-3 py-3">
                    <input 
                      type="number" step="0.5"
                      value={rule.stepPrice}
                      onChange={(e) => handleChange(idx, 'stepPrice', e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm border p-1.5 w-24"
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => removeRule(idx)} className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {localRules.length === 0 && (
                  <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                          暂无规则，请点击下方按钮添加，或上传Excel文件
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
          
          <div className="mt-4">
             <button onClick={addRule} className="flex items-center text-sm text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 rounded hover:bg-purple-50 transition-colors border border-dashed border-purple-200 hover:border-purple-400">
                <Plus className="h-4 w-4 mr-1" />
                添加规则
             </button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center rounded-b-xl">
          <div className="flex items-center text-xs text-gray-500 gap-2 min-h-[20px]">
            {isSaving && (
                <span className="flex items-center text-purple-600 animate-pulse">
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
            <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center transition-all shadow-md hover:shadow-lg">
                <Check className="h-4 w-4 mr-2" />
                完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralFeeConfigModal;
