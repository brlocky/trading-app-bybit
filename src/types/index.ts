import {
  AccountOrderV5,
  PositionIdx,
  TPSLModeV5,
  TickerLinearInverseV5,
  TradeModeV5,
} from 'bybit-api';
import { CandlestickData } from 'lightweight-charts';

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

export type ITicker = TickerLinearInverseV5

export interface IPosition {
  bustPrice?: string;
  createdTime: string;
  cumRealisedPnl: string;
  entryPrice: string;
  leverage?: string;
  liqPrice: string;
  markPrice: string;
  positionBalance: string;
  positionIdx: PositionIdx;
  positionMM?: string;
  positionIM?: string;
  positionStatus: 'Normal' | 'Liq' | 'Adl';
  positionValue: string;
  riskId: number;
  riskLimitValue: string;
  side: string;
  size: string;
  stopLoss?: string;
  symbol: string;
  takeProfit?: string;
  tpslMode?: TPSLModeV5;
  tradeMode: TradeModeV5;
  trailingStop?: string;
  unrealisedPnl: string;
}

export interface IOrder extends AccountOrderV5 {
  chase?: boolean;
}


export interface IOrderbookResponse {
  s: string;
  b: string[];
  a: string[];
  ts: number;
  u: number;
}

export type CandlestickDataWithVolume = CandlestickData & { volume: number };
