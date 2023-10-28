import { TickerLinearInverseV5 } from 'bybit-api';
import { CandlestickData, Time } from 'lightweight-charts';

export interface IWsConfig {
  key: string;
  secret: string;
}

export interface IWsResponseData<T> {
  topic: string;
  id: string;
  creationTime: number;
  data: T;
}

export type ITicker = TickerLinearInverseV5;

export interface ITradeResponse {
  i: string; // Trade ID
  s: string; // Symbol name
  T: number; // The timestamp (ms) that the order is filled
  L: string; // Direction of price change. Unique field for future
  S: string; // Side of taker. Buy,Sell
  p: string; // Trade price
  v: string; // Trade size
  BT: boolean; // Whether it is a block trade order or not
}

export interface IOrderbookResponse {
  s: string;
  b: string[];
  a: string[];
  ts: number;
  u: number;
}

export type CandlestickDataWithVolume = CandlestickData & { volume: number };
export type ChartLine = {
  time: Time;
  value: number;
};

export interface ITarget {
  price: number;
  qty?: number;
}

export type IChartLineType = 'TP' | 'SL' | 'ENTRY';

export interface IChartLine {
  type: IChartLineType;
  price: string;
  qty?: number;
  draggable: boolean;
  orderId?: string;
}
