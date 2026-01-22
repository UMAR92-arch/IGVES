
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { PriceData } from '../types';

interface DrawingPath {
  id: string;
  points: [number, number][];
}

interface TradingChartProps {
  data: PriceData[];
  assetName: string;
  inspectorMode: boolean;
  activeTool: 'pointer' | 'pencil' | 'eraser';
}

const TradingChart: React.FC<TradingChartProps> = ({ data, assetName, inspectorMode, activeTool }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverData, setHoverData] = useState<PriceData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Transformatsiya holati
  const [transform, setTransform] = useState(d3.zoomIdentity);

  // Chizmalar holati
  const [drawings, setDrawings] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom va Pan boshqaruvi
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 50])
      .on("zoom", (event) => {
        if (activeTool === 'pointer') {
          setTransform(event.transform);
        }
      });

    if (activeTool === 'pointer') {
      svg.call(zoom);
    } else {
      svg.on(".zoom", null);
    }
  }, [activeTool]);

  // Grafikni qayta chizish
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll(".main-container").remove();

    const margin = { top: 20, right: 65, bottom: 40, left: 10 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Asosiy guruh
    const container = svg.append("g")
      .attr("class", "main-container")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Skeyllar (Scales) - Linear Index Scale ishlatamiz
    const xBase = d3.scaleLinear()
      .domain([-1, data.length])
      .range([0, width]);

    const yBase = d3.scaleLinear()
      .domain([d3.min(data, d => d.low) || 0, d3.max(data, d => d.high) || 0])
      .range([height, 0])
      .nice();

    // Zoom qo'llanilgan skeyllar
    const x = transform.rescaleX(xBase);
    const y = transform.rescaleY(yBase);

    // Shamning kengligini hisoblash
    const candleWidth = Math.abs(x(1) - x(0)) * 0.7;

    // O'qlarni tayyorlash
    const xAxis = d3.axisBottom(x)
      .ticks(dimensions.width / 100)
      .tickFormat(i => {
        const idx = Math.round(i as number);
        if (idx >= 0 && idx < data.length) {
          return new Date(data[idx].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return "";
      });

    const yAxis = d3.axisRight(y as any).ticks(10);

    // Setka (Grid)
    container.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.05)
      .call(d3.axisLeft(y as any).tickSize(-width).tickFormat(() => ""));

    // Klip (Grafik o'qlardan chiqib ketmasligi uchun)
    svg.select("defs").remove();
    const defs = svg.append("defs");
    defs.append("clipPath")
      .attr("id", "chart-clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    // O'qlarni chizish
    container.append("g")
      .attr("transform", `translate(0, ${height})`)
      .attr("class", "text-neutral-500 x-axis")
      .call(xAxis);

    container.append("g")
      .attr("transform", `translate(${width}, 0)`)
      .attr("class", "text-neutral-500 y-axis")
      .call(yAxis);

    // Kontent qatlami (Shu yerda shamlar chiziladi)
    const content = container.append("g")
      .attr("clip-path", "url(#chart-clip)");

    // Shamlar (Candlesticks)
    const candles = content.selectAll(".candle")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "candle");

    // Sham tayoqchasi (Wick)
    candles.append("line")
      .attr("x1", (_, i) => x(i))
      .attr("x2", (_, i) => x(i))
      .attr("y1", d => y(d.high))
      .attr("y2", d => y(d.low))
      .attr("stroke", d => d.close >= d.open ? "#00ff88" : "#ff4d4d")
      .attr("stroke-width", Math.max(0.5, candleWidth * 0.1));

    // Sham tanasi (Body)
    candles.append("rect")
      .attr("x", (_, i) => x(i) - candleWidth / 2)
      .attr("y", d => y(Math.max(d.open, d.close)))
      .attr("width", candleWidth)
      .attr("height", d => Math.max(0.5, Math.abs(y(d.open) - y(d.close))))
      .attr("fill", d => d.close >= d.open ? "#00ff88" : "#ff4d4d");

    // Volume (Hajm)
    const volY = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.volume) || 0])
      .range([height, height - 60]);

    content.selectAll(".vol")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (_, i) => x(i) - candleWidth / 2)
      .attr("y", d => volY(d.volume))
      .attr("width", candleWidth)
      .attr("height", d => height - volY(d.volume))
      .attr("fill", d => d.close >= d.open ? "#00ff8822" : "#ff4d4d22");

  }, [data, dimensions, transform]);

  // Interaktiv funksiyalar
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pencil') {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      setIsDrawing(true);
      setCurrentPath({
        id: Math.random().toString(36).substr(2, 9),
        points: [[e.clientX - rect.left, e.clientY - rect.top]]
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;

    // Crosshair/Inspector
    const margin = { top: 20, right: 65, bottom: 40, left: 10 };
    const chartX = xPos - margin.left;
    const width = dimensions.width - margin.left - margin.right;
    
    const xBase = d3.scaleLinear().domain([-1, data.length]).range([0, width]);
    const x = transform.rescaleX(xBase);
    
    // Invert x coordinate to find index
    const index = Math.round(x.invert(chartX));
    
    if (index >= 0 && index < data.length) {
      setHoverData(data[index]);
      setMousePos({ x: e.clientX, y: e.clientY });
    } else {
      setHoverData(null);
    }

    if (isDrawing && currentPath) {
      setCurrentPath({
        ...currentPath,
        points: [...currentPath.points, [xPos, yPos]]
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath) {
      setDrawings(prev => [...prev, currentPath]);
      setCurrentPath(null);
      setIsDrawing(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden" 
      style={{ cursor: activeTool === 'pencil' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : activeTool === 'pointer' ? (transform.k === 1 ? 'default' : 'grabbing') : 'default' }}
    >
      {/* Control Overlay */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button 
          onClick={() => setTransform(d3.zoomIdentity)}
          className="px-3 py-1.5 bg-neutral-900/90 border border-neutral-800 rounded-md text-[10px] font-black text-neutral-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all uppercase tracking-widest"
        >
          <i className="fas fa-expand-arrows-alt mr-1"></i> Reset View
        </button>
      </div>

      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="block touch-none"
      >
        {/* Drawings Layer (Must be separate for correct coordinates) */}
        <g className="drawings-layer">
          {drawings.map(draw => (
            <path
              key={draw.id}
              d={`M ${draw.points.map(p => `${p[0]},${p[1]}`).join(' L ')}`}
              fill="none"
              stroke={activeTool === 'eraser' ? "#ff4d4d" : "#00ff88"}
              strokeWidth={activeTool === 'eraser' ? 12 : 2}
              strokeOpacity={activeTool === 'eraser' ? 0.3 : 0.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ cursor: activeTool === 'eraser' ? 'pointer' : 'default', pointerEvents: activeTool === 'eraser' ? 'all' : 'none' }}
              onClick={(e) => {
                if (activeTool === 'eraser') {
                  e.stopPropagation();
                  setDrawings(prev => prev.filter(d => d.id !== draw.id));
                }
              }}
            />
          ))}
          {currentPath && (
            <path
              d={`M ${currentPath.points.map(p => `${p[0]},${p[1]}`).join(' L ')}`}
              fill="none"
              stroke="#00ff88"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}
        </g>
      </svg>
      
      {/* Dynamic Inspector Window */}
      {inspectorMode && hoverData && !isDrawing && (
        <div 
          className="fixed z-50 pointer-events-none bg-black/90 border border-emerald-500/50 p-3 rounded shadow-2xl backdrop-blur-xl"
          style={{ left: mousePos.x + 15, top: mousePos.y - 120 }}
        >
          <div className="text-[9px] text-emerald-500 font-black mb-2 uppercase tracking-widest border-b border-emerald-500/20 pb-1">{assetName} DATA</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono">
            <div className="text-[10px] text-neutral-500">Ochilish:</div>
            <div className="text-[10px] text-right">{hoverData.open.toFixed(2)}</div>
            <div className="text-[10px] text-neutral-500">Yuqori:</div>
            <div className="text-[10px] text-right text-emerald-400">{hoverData.high.toFixed(2)}</div>
            <div className="text-[10px] text-neutral-500">Past:</div>
            <div className="text-[10px] text-right text-rose-400">{hoverData.low.toFixed(2)}</div>
            <div className="text-[10px] text-neutral-500 font-bold">Yopilish:</div>
            <div className="text-[10px] text-right font-bold">{hoverData.close.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Crosshair indicator lines */}
      {hoverData && !isDrawing && activeTool === 'pointer' && (
        <>
          <div className="absolute top-0 bottom-0 border-l border-white/10 pointer-events-none" 
               style={{ left: mousePos.x - (containerRef.current?.getBoundingClientRect().left || 0) }} />
          <div className="absolute left-0 right-0 border-t border-white/10 pointer-events-none" 
               style={{ top: mousePos.y - (containerRef.current?.getBoundingClientRect().top || 0) }} />
        </>
      )}
    </div>
  );
};

export default TradingChart;
