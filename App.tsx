
import React, { useState, useEffect, useCallback } from 'react';
import TradingChart from './components/TradingChart';
import { generateMockCandles, INITIAL_ASSETS } from './mockData';
import { PriceData, AssetType } from './types';
import { getMarketAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<AssetType>('BTC');
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize data
  useEffect(() => {
    const basePrices = {
      BTC: 65000,
      GOLD: 2350,
      FOREX: 1.08,
      INFLATION: 3.2,
      UNEMPLOYMENT: 3.8
    };
    setChartData(generateMockCandles(100, basePrices[selectedAsset]));
  }, [selectedAsset]);

  // Handle AI analysis
  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    const analysis = await getMarketAnalysis(selectedAsset);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const getPriceColor = (change: number) => change >= 0 ? 'text-emerald-500' : 'text-rose-500';

  return (
    <div className="flex h-screen w-screen bg-[#050505] overflow-hidden text-neutral-200">
      {/* Left Sidebar - Tools */}
      <div className="w-16 flex flex-col items-center py-4 border-r border-neutral-800 bg-[#0a0a0a] gap-6">
        <div className="text-emerald-500 font-black text-xl mb-4">IV</div>
        <button className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"><i className="fas fa-mouse-pointer"></i></button>
        <button className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"><i className="fas fa-pencil-alt"></i></button>
        <button className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"><i className="fas fa-eraser"></i></button>
        <button 
          onClick={() => setInspectorMode(!inspectorMode)}
          className={`p-2 rounded transition-all ${inspectorMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-neutral-400 hover:text-white'}`}
          title="Toggle Data Inspector"
        >
          <i className="fas fa-comment-alt"></i>
        </button>
        <div className="mt-auto pb-4 flex flex-col gap-6">
            <button className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"><i className="fas fa-cog"></i></button>
            <button className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"><i className="fas fa-user-circle"></i></button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header / Ticker */}
        <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-4 bg-[#0a0a0a]">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-white tracking-tighter">IGVES <span className="text-emerald-500">PRO</span></h1>
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              {Object.entries(INITIAL_ASSETS).map(([name, data]) => (
                <button 
                  key={name}
                  onClick={() => setSelectedAsset(name as AssetType)}
                  className={`flex flex-col items-start min-w-[100px] transition-all ${selectedAsset === name ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-70'}`}
                >
                  <div className="text-[10px] font-bold text-neutral-500 uppercase">{name}</div>
                  <div className="flex gap-2 items-baseline">
                    <span className="text-sm font-mono font-medium">{data.price.toFixed(name === 'FOREX' ? 4 : 2)}</span>
                    <span className={`text-[10px] ${getPriceColor(data.change)}`}>{data.change > 0 ? '+' : ''}{data.change}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE MARKET
             </div>
             <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-neutral-800 rounded transition-colors"
             >
                <i className={`fas ${sidebarOpen ? 'fa-indent' : 'fa-outdent'}`}></i>
             </button>
          </div>
        </div>

        {/* Dynamic Indicators Bar */}
        <div className="h-10 bg-[#080808] border-b border-neutral-800/50 flex items-center px-4 gap-4 text-[11px] font-medium text-neutral-400">
           <div className="flex items-center gap-2">
              <span className="text-emerald-500">VOLUME:</span>
              <span className="text-neutral-200">2.41B</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-purple-400">RSI(14):</span>
              <span className="text-neutral-200">54.2</span>
           </div>
           <div className="flex items-center gap-2 ml-auto">
              <span>H: <span className="text-emerald-400">65,920</span></span>
              <span>L: <span className="text-rose-400">64,110</span></span>
              <span>AVG: <span className="text-neutral-200">65,015</span></span>
           </div>
        </div>

        {/* Chart Viewport */}
        <div className="flex-1 bg-black relative trading-view-grid">
           <TradingChart 
             data={chartData} 
             assetName={selectedAsset} 
             inspectorMode={inspectorMode}
           />
           
           {/* Chart Overlays / Controls */}
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1 bg-zinc-900/80 backdrop-blur rounded-full border border-neutral-800 shadow-xl">
              <button className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded-full"><i className="fas fa-search-minus"></i></button>
              <div className="px-3 text-xs font-mono font-bold text-neutral-500">1H</div>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded-full"><i className="fas fa-search-plus"></i></button>
              <div className="w-[1px] h-4 bg-neutral-700 mx-1"></div>
              <button className="px-4 py-1 text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-colors">BUY</button>
              <button className="px-4 py-1 text-xs bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-full transition-colors">SELL</button>
           </div>
        </div>
      </div>

      {/* Right Sidebar - AI Analysis */}
      {sidebarOpen && (
        <div className="w-80 border-l border-neutral-800 bg-[#0a0a0a] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2">
              <i className="fas fa-brain text-emerald-500"></i>
              AI ANALYST
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] text-neutral-500 font-bold uppercase">Target Asset</label>
               <div className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-400">{selectedAsset}</span>
                  <i className="fas fa-chart-line text-neutral-600"></i>
               </div>
            </div>

            <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              {isAnalyzing ? (
                <>
                  <i className="fas fa-circle-notch animate-spin"></i>
                  ANALYZING...
                </>
              ) : (
                <>
                  <i className="fas fa-bolt"></i>
                  RUN INTELLIGENCE
                </>
              )}
            </button>

            {aiAnalysis && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                  <div className="text-[10px] text-emerald-500 font-bold mb-2 uppercase tracking-widest">Market Context</div>
                  <div className="text-sm leading-relaxed text-neutral-300 font-light">
                    {aiAnalysis}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="text-[10px] text-neutral-500 mb-1">Sentiment</div>
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <i className="fas fa-arrow-up"></i> BULLISH
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="text-[10px] text-neutral-500 mb-1">Volatility</div>
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <i className="fas fa-tachometer-alt"></i> HIGH
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!aiAnalysis && !isAnalyzing && (
              <div className="text-center py-10">
                <i className="fas fa-robot text-4xl text-neutral-800 mb-4"></i>
                <p className="text-sm text-neutral-500">Click the button above to start AI deep-market analysis for {selectedAsset}.</p>
              </div>
            )}
          </div>

          {/* Social / News Footer */}
          <div className="p-4 bg-zinc-900/30 border-t border-neutral-800 mt-auto">
             <div className="text-[10px] text-neutral-500 font-bold uppercase mb-3">Live Feed</div>
             <div className="space-y-3">
                <div className="flex gap-3">
                   <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                   <div>
                      <div className="text-[11px] text-neutral-300 line-clamp-1">Fed signals pause in rate hikes for Q3</div>
                      <div className="text-[9px] text-neutral-500">2 mins ago</div>
                   </div>
                </div>
                <div className="flex gap-3">
                   <div className="w-1 h-8 bg-rose-500 rounded-full"></div>
                   <div>
                      <div className="text-[11px] text-neutral-300 line-clamp-1">Unemployment rates exceed projection</div>
                      <div className="text-[9px] text-neutral-500">15 mins ago</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
