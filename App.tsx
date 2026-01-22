
import React, { useState, useEffect } from 'react';
import TradingChart from './components/TradingChart';
import { generateMockCandles, INITIAL_ASSETS } from './mockData';
import { PriceData, AssetType } from './types';
import { getMarketAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'overview' | 'chart'>('overview');
  const [selectedAsset, setSelectedAsset] = useState<AssetType>('BTC');
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Asboblar holati: kursor, qalam yoki o'chirg'ich
  const [activeTool, setActiveTool] = useState<'pointer' | 'pencil' | 'eraser'>('pointer');

  useEffect(() => {
    try {
      const basePrices = {
        BTC: 65000,
        GOLD: 2350,
        FOREX: 1.08,
        INFLATION: 3.2,
        USD_UZS: 12075.58,
        UNEMPLOYMENT: 4.9
      };
      setChartData(generateMockCandles(100, basePrices[selectedAsset]));
    } catch (err) {
      console.error("Initialization error:", err);
      setError("Dasturni yuklashda xatolik yuz berdi.");
    }
  }, [selectedAsset]);

  const handleSelectAsset = (asset: AssetType) => {
    setSelectedAsset(asset);
    setView('chart');
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis('');
    const displayName = getDisplayName(selectedAsset);
    const analysis = await getMarketAnalysis(displayName);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const getPriceColor = (change: number) => change >= 0 ? 'text-emerald-500' : 'text-rose-500';
  const getBgColor = (change: number) => change >= 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5';
  const getBorderColor = (change: number) => change >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20';

  const getDisplayName = (name: string) => {
    switch (name) {
      case 'USD_UZS': return 'USD TO UZS';
      case 'UNEMPLOYMENT': return 'ISHSIZLIK DARAJASI';
      case 'INFLATION': return 'INFLYATSIYA';
      case 'BTC': return 'BITCOIN';
      case 'GOLD': return 'OLTIN';
      case 'FOREX': return 'EUR/USD';
      default: return name;
    }
  };

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-rose-500 font-mono">
        <div className="p-8 border border-rose-500/30 bg-rose-500/5 rounded-lg text-center">
          <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <h1 className="text-xl font-bold mb-2">XATOLIK YUZ BERDI</h1>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600">Qayta yuklash</button>
        </div>
      </div>
    );
  }

  if (view === 'overview') {
    return (
      <div className="min-h-screen w-full bg-[#050505] text-white p-8 md:p-16 overflow-y-auto">
        <div className="max-w-7xl mx-auto pb-24">
          <header className="mb-12 flex justify-between items-end border-b border-neutral-800 pb-8">
            <div>
              <h1 className="text-5xl font-black tracking-tighter mb-2 italic">IGVES <span className="text-emerald-500">PRO</span></h1>
              <p className="text-neutral-500 font-medium tracking-widest uppercase text-xs">Professional Bozor Tahlili va Monitoringi</p>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Global Holat</div>
              <div className="text-emerald-500 font-mono text-xl animate-pulse">● STABIL</div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(INITIAL_ASSETS).map(([name, data]) => (
              <div 
                key={name}
                onClick={() => handleSelectAsset(name as AssetType)}
                className={`group relative p-8 rounded-2xl border ${getBorderColor(data.change)} ${getBgColor(data.change)} hover:scale-[1.02] hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden shadow-2xl min-h-[220px]`}
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight uppercase">{getDisplayName(name)}</h3>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                      Aktiv turi: {name === 'BTC' ? 'Kripto' : name === 'GOLD' ? 'Tovar' : name === 'FOREX' || name === 'USD_UZS' ? 'Valyuta' : 'Iqtisodiy'}
                    </span>
                  </div>
                  <div className={`text-sm font-mono font-bold px-2 py-1 rounded ${data.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {data.change > 0 ? '+' : ''}{data.change}%
                  </div>
                </div>

                <div className="mb-8">
                  <div className="text-4xl font-mono font-light tracking-tighter">
                    {data.price.toLocaleString(undefined, { minimumFractionDigits: name === 'FOREX' ? 4 : 2 })}
                    <span className="text-xs text-neutral-600 ml-2">
                      {name === 'FOREX' ? 'USD' : name === 'BTC' || name === 'GOLD' ? '$' : name === 'USD_UZS' ? 'UZS' : '%'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tighter">
                  <span className="text-neutral-500 group-hover:text-emerald-500 transition-colors">Grafikni ochish <i className="fas fa-arrow-right ml-1"></i></span>
                  <div className="flex gap-1 h-8 items-end">
                    {[1,4,2,6,3,8,4,9].map((h, i) => (
                      <div key={i} className={`w-1 rounded-t ${data.change >= 0 ? 'bg-emerald-500/40' : 'bg-rose-500/40'}`} style={{ height: `${h * 10}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="p-8 rounded-2xl border border-neutral-800 bg-neutral-900/40 flex flex-col justify-center items-center text-center group hover:bg-neutral-800/60 transition-all min-h-[220px]">
               <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <i className="fas fa-brain text-2xl text-emerald-500"></i>
               </div>
               <h3 className="text-lg font-bold mb-2 uppercase">AI Tahlilchi</h3>
               <p className="text-xs text-neutral-500 leading-relaxed mb-6">Bozordagi trendlarni o'zbek tilidagi sun'iy intellekt yordamida tahlil qiling.</p>
               <div className="px-4 py-2 bg-neutral-800 rounded-full text-[10px] font-bold text-neutral-400 uppercase tracking-widest border border-neutral-700">Aktivni tanlang</div>
            </div>
          </div>

          <footer className="mt-24 pt-8 border-t border-neutral-900 flex justify-between items-center text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em]">
             <div>© 2024 IGVES FINANCIAL SYSTEMS</div>
             <div className="flex gap-8">
                <a href="#" className="hover:text-emerald-500 transition-colors">TERMINAL</a>
                <a href="#" className="hover:text-emerald-500 transition-colors">NEWS</a>
                <a href="#" className="hover:text-emerald-500 transition-colors">API</a>
             </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#050505] overflow-hidden text-neutral-200">
      <div className="w-16 flex flex-col items-center py-4 border-r border-neutral-800 bg-[#0a0a0a] gap-6">
        <button onClick={() => setView('overview')} className="text-emerald-500 font-black text-xl mb-4 hover:scale-110 transition-transform" title="Bosh sahifaga">IV</button>
        
        {/* Toolbar tugmalari */}
        <button 
          onClick={() => setActiveTool('pointer')}
          className={`p-2 rounded transition-all ${activeTool === 'pointer' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-400 hover:text-white'}`}
          title="Kursor"
        >
          <i className="fas fa-mouse-pointer text-lg"></i>
        </button>
        
        <button 
          onClick={() => setActiveTool('pencil')}
          className={`p-2 rounded transition-all ${activeTool === 'pencil' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-400 hover:text-white'}`}
          title="Qalam bilan chizish"
        >
          <i className="fas fa-pencil-alt text-lg"></i>
        </button>

        <button 
          onClick={() => setActiveTool('eraser')}
          className={`p-2 rounded transition-all ${activeTool === 'eraser' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-neutral-400 hover:text-white'}`}
          title="O'chirish (Eraser)"
        >
          <i className="fas fa-eraser text-lg"></i>
        </button>

        <button 
          onClick={() => setInspectorMode(!inspectorMode)}
          className={`p-2 rounded transition-all mt-4 ${inspectorMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-neutral-400 hover:text-white'}`}
          title="Ma'lumotlar inspektori"
        >
          <i className="fas fa-crosshairs text-lg"></i>
        </button>

        <div className="mt-auto pb-4 flex flex-col gap-6">
            <button className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"><i className="fas fa-cog"></i></button>
            <button className="p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"><i className="fas fa-user-circle"></i></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-4 bg-[#0a0a0a]">
          <div className="flex items-center gap-6">
            <button onClick={() => setView('overview')} className="text-neutral-500 hover:text-white transition-colors mr-2">
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar max-w-[60vw]">
              {Object.entries(INITIAL_ASSETS).map(([name, data]) => (
                <button 
                  key={name}
                  onClick={() => setSelectedAsset(name as AssetType)}
                  className={`flex flex-col items-start min-w-[110px] px-3 py-1 rounded transition-all ${selectedAsset === name ? 'bg-emerald-500/10 border border-emerald-500/30' : 'opacity-40 hover:opacity-100'}`}
                >
                  <div className="text-[9px] font-bold text-neutral-500 uppercase truncate w-full">{getDisplayName(name)}</div>
                  <div className="flex gap-2 items-baseline">
                    <span className="text-xs font-mono">{data.price.toFixed(name === 'FOREX' ? 4 : 2)}{name === 'INFLATION' || name === 'UNEMPLOYMENT' ? '%' : ''}</span>
                    <span className={`text-[8px] ${getPriceColor(data.change)}`}>{data.change > 0 ? '+' : ''}{data.change}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-neutral-800 rounded">
            <i className={`fas ${sidebarOpen ? 'fa-indent' : 'fa-outdent'}`}></i>
          </button>
        </div>

        <div className="flex-1 bg-black relative trading-view-grid overflow-hidden">
           {chartData.length > 0 ? (
             <TradingChart data={chartData} assetName={getDisplayName(selectedAsset)} inspectorMode={inspectorMode} activeTool={activeTool} />
           ) : (
             <div className="h-full w-full flex items-center justify-center text-neutral-600 font-mono text-xs tracking-widest uppercase">Yuklanmoqda...</div>
           )}
        </div>
      </div>

      {sidebarOpen && (
        <div className="w-80 border-l border-neutral-800 bg-[#0a0a0a] flex flex-col animate-in slide-in-from-right overflow-hidden">
          <div className="p-4 border-b border-neutral-800">
            <h2 className="font-black flex items-center gap-2 uppercase text-sm">
              <i className="fas fa-brain text-emerald-500"></i>
              AI Deep Terminal (UZ)
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-900 text-black font-black rounded-xl transition-all text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/5"
            >
              {isAnalyzing ? "TAHLIL QILINMOQDA..." : "AI TAHLILNI BOSHLASH"}
            </button>

            {aiAnalysis && (
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[10px] text-emerald-500 font-bold mb-3 uppercase tracking-[0.2em]">AI SIGNAL ({getDisplayName(selectedAsset)})</div>
                <div className="text-xs leading-relaxed text-neutral-400 font-medium whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
