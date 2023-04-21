import {
  AccountOrderV5,
  ContractSymbolTicker,
  PositionIdx,
  TPSLModeV5,
  TickerLinearInverseV5,
  TradeModeV5,
} from "bybit-api";

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

export interface ITicker extends TickerLinearInverseV5 {
}

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

export interface IOrder extends AccountOrderV5 {}
