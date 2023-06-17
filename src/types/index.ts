import { TickerLinearInverseV5 } from 'bybit-api';
import { CandlestickData } from '@felipecsl/lightweight-charts';

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


export interface IOrderbookResponse {
  s: string;
  b: string[];
  a: string[];
  ts: number;
  u: number;
}

export type CandlestickDataWithVolume = CandlestickData & { volume: number };

export interface ITarget {
  price: number;
  qty?: number;
}

export type IChartLineType = 'TP' | 'SL' | 'ENTRY'

export interface IChartLine {
  type: IChartLineType;
  price: string;
  qty?: number;
  draggable: boolean;
  orderId?: string;
}
