
import { PriceData } from './types';

export const generateMockCandles = (count: number, basePrice: number): PriceData[] => {
  const data: PriceData[] = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * 60000).toISOString();
    const volatility = basePrice * 0.002;
    const open = currentPrice;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    const volume = Math.random() * 1000 + 500;
    
    // Simple RSI approximation for mock
    const rsi = 30 + Math.random() * 40;

    data.push({ time, open, high, low, close, volume, rsi });
    currentPrice = close;
  }
  return data;
};

export const INITIAL_ASSETS = {
  BTC: { price: 65420.50, change: 1.25 },
  GOLD: { price: 2350.15, change: -0.45 },
  FOREX: { price: 1.0850, change: 0.12 },
  INFLATION: { price: 3.2, change: -0.1 },
  UNEMPLOYMENT: { price: 3.8, change: 0.2 }
};
