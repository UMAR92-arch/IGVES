
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { PriceData } from '../types';

interface TradingChartProps {
  data: PriceData[];
  assetName: string;
  inspectorMode: boolean;
}

const TradingChart: React.FC<TradingChartProps> = ({ data, assetName, inspectorMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverData, setHoverData] = useState<PriceData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 60, bottom: 120, left: 10 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.time))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.low) || 0, d3.max(data, d => d.high) || 0])
      .range([height, 0])
      .nice();

    // RSI Scale
    const rsiY = d3.scaleLinear()
      .domain([0, 100])
      .range([height + 100, height + 20]);

    // Volume Scale
    const volY = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.volume) || 0])
      .range([height, height - 100]);

    // Axes
    const xAxis = d3.axisBottom(x)
      .tickValues(x.domain().filter((_, i) => i % 10 === 0))
      .tickFormat(d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    const yAxis = d3.axisRight(y);

    chart.append("g")
      .attr("transform", `translate(0, ${height})`)
      .attr("class", "text-neutral-500")
      .call(xAxis);

    chart.append("g")
      .attr("transform", `translate(${width}, 0)`)
      .attr("class", "text-neutral-500")
      .call(yAxis);

    // Grid lines
    chart.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""));

    // Volume Bars
    chart.selectAll(".volume")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "volume")
      .attr("x", d => x(d.time) || 0)
      .attr("y", d => volY(d.volume))
      .attr("width", x.bandwidth())
      .attr("height", d => height - volY(d.volume))
      .attr("fill", d => d.close >= d.open ? "#00ff8844" : "#ff4d4d44");

    // Candlesticks
    const candles = chart.selectAll(".candle")
      .data(data)
      .enter()
      .append("g");

    // Wicks
    candles.append("line")
      .attr("x1", d => (x(d.time) || 0) + x.bandwidth() / 2)
      .attr("x2", d => (x(d.time) || 0) + x.bandwidth() / 2)
      .attr("y1", d => y(d.high))
      .attr("y2", d => y(d.low))
      .attr("stroke", d => d.close >= d.open ? "#00ff88" : "#ff4d4d")
      .attr("stroke-width", 1);

    // Bodies
    candles.append("rect")
      .attr("x", d => x(d.time) || 0)
      .attr("y", d => y(Math.max(d.open, d.close)))
      .attr("width", x.bandwidth())
      .attr("height", d => Math.abs(y(d.open) - y(d.close)) || 1)
      .attr("fill", d => d.close >= d.open ? "#00ff88" : "#ff4d4d");

    // RSI Plot
    const rsiLine = d3.line<PriceData>()
      .x(d => (x(d.time) || 0) + x.bandwidth() / 2)
      .y(d => rsiY(d.rsi || 50));

    chart.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#9d4edd")
      .attr("stroke-width", 1.5)
      .attr("d", rsiLine);

    // RSI Base lines
    chart.append("line").attr("x1", 0).attr("x2", width).attr("y1", rsiY(70)).attr("y2", rsiY(70)).attr("stroke", "#333").attr("stroke-dasharray", "4");
    chart.append("line").attr("x1", 0).attr("x2", width).attr("y1", rsiY(30)).attr("y2", rsiY(30)).attr("stroke", "#333").attr("stroke-dasharray", "4");

    // Interaction Overlays
    const overlay = chart.append("rect")
      .attr("width", width)
      .attr("height", height + 100)
      .attr("fill", "transparent")
      .on("mousemove", (event) => {
        const [mx, my] = d3.pointer(event);
        const eachBand = x.step();
        const index = Math.floor(mx / eachBand);
        const d = data[index];
        if (d) {
          setHoverData(d);
          setMousePos({ x: event.clientX, y: event.clientY });
        }
      })
      .on("mouseleave", () => {
        setHoverData(null);
      });

  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-crosshair">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
      
      {/* Dynamic Inspector Window */}
      {inspectorMode && hoverData && (
        <div 
          className="fixed z-50 pointer-events-none bg-zinc-900/90 border border-emerald-500/50 p-3 rounded-lg shadow-2xl backdrop-blur-md"
          style={{ left: mousePos.x + 15, top: mousePos.y - 100 }}
        >
          <div className="text-[10px] text-emerald-500 font-bold mb-1 uppercase tracking-wider">{assetName} Metrics</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="text-[11px] text-zinc-400">Open</div>
            <div className="text-[11px] font-mono">{hoverData.open.toFixed(2)}</div>
            <div className="text-[11px] text-zinc-400">High</div>
            <div className="text-[11px] font-mono text-emerald-400">{hoverData.high.toFixed(2)}</div>
            <div className="text-[11px] text-zinc-400">Low</div>
            <div className="text-[11px] font-mono text-rose-400">{hoverData.low.toFixed(2)}</div>
            <div className="text-[11px] text-zinc-400">Close</div>
            <div className="text-[11px] font-mono">{hoverData.close.toFixed(2)}</div>
            <div className="text-[11px] text-zinc-400 border-t border-zinc-700 mt-1 pt-1">RSI</div>
            <div className="text-[11px] font-mono text-purple-400 border-t border-zinc-700 mt-1 pt-1">{hoverData.rsi?.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Crosshair Lines (Custom) */}
      {hoverData && (
        <>
          <div className="absolute top-0 bottom-0 border-l border-white/20 pointer-events-none" 
               style={{ left: (dimensions.width * data.indexOf(hoverData) / data.length) + (dimensions.width / data.length / 2) }} />
        </>
      )}
    </div>
  );
};

export default TradingChart;
