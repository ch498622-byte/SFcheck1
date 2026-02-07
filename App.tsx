
import React, { useState } from 'react';
import { Box, Truck } from 'lucide-react';
import SFVerifier from './components/SFVerifier';
import GeneralVerifier from './components/GeneralVerifier';

type Tab = 'sf' | 'general';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('sf');

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
           <div className="bg-blue-600 p-1.5 rounded-lg mr-3">
             <Box className="h-5 w-5 text-white" />
           </div>
           <h1 className="text-lg font-bold text-gray-900 tracking-tight">Bill Verifier</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <button
                onClick={() => setActiveTab('sf')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'sf' 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
                <Truck className={`h-5 w-5 mr-3 ${activeTab === 'sf' ? 'text-blue-600' : 'text-gray-400'}`} />
                顺丰快递核对
                {activeTab === 'sf' && <span className="ml-auto bg-blue-200 w-2 h-2 rounded-full"></span>}
            </button>

            <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'general' 
                    ? 'bg-purple-50 text-purple-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
                <Box className={`h-5 w-5 mr-3 ${activeTab === 'general' ? 'text-purple-600' : 'text-gray-400'}`} />
                其他快递核对
                {activeTab === 'general' && <span className="ml-auto bg-purple-200 w-2 h-2 rounded-full"></span>}
            </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-400 text-center">
                <p>v1.2.0</p>
                <p className="mt-1">本地安全运行</p>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header (Only visible on small screens if we added responsiveness, but keeping simple for now) */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 lg:hidden">
            <h2 className="font-bold text-gray-900">
                {activeTab === 'sf' ? '顺丰快递账单核对' : '通用快递账单核对'}
            </h2>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'sf' ? '顺丰快递账单核对' : '通用快递账单核对'}
                    </h2>
                    <p className="text-gray-500 mt-1">
                        {activeTab === 'sf' 
                         ? '支持特快/标快运费、包装费及保价费自动计算' 
                         : '适用于中通、圆通、韵达等基于“首重+续重”模式的快递公司'}
                    </p>
                </div>

                {activeTab === 'sf' ? <SFVerifier /> : <GeneralVerifier />}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
