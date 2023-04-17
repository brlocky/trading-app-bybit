import { PositionIdx, TPSLModeV5, TradeModeV5 } from "bybit-api";

export interface WsConfig {
  key: string;
  secret: string;
}

export interface WsResponseData<T> {
  topic: string;
  id: string;
  creationTime: number;
  data: T;
}

export interface TickerV5 {
  symbol: string;
  lastPrice: string;
  indexPrice?: string;
  markPrice?: string;
}

export interface PositionWSV5 {
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
  positionStatus: "Normal" | "Liq" | "Adl";
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
