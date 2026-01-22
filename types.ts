
export interface PriceData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
}

export interface MarketStat {
  label: string;
  value: string;
  change: number;
  isPercent?: boolean;
}

export type AssetType = 'BTC' | 'GOLD' | 'FOREX' | 'INFLATION' | 'USD_UZS' | 'UNEMPLOYMENT';

export interface AIAnalysis {
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  keyLevels: string[];
  news: string[];
}
