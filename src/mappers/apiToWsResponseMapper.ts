import { PositionV5 } from "bybit-api";
import { PositionWSV5 } from "../types";

// Mapper function to convert ApiResponse to WsResponse
export const mapApiToWsPositionV5Response = (response: PositionV5): PositionWSV5 => {
    return {
        bustPrice: response.bustPrice,
        createdTime: response.createdTime,
        cumRealisedPnl: "0",
        entryPrice: response.avgPrice,
        leverage: response.leverage,
        liqPrice: response.liqPrice,
        markPrice: response.markPrice,
        positionBalance: "0",
        positionIdx: response.positionIdx,
        positionMM: response.positionMM,
        positionIM:response.positionIM,
        positionStatus: response.positionStatus,
        positionValue: response.positionValue,
        riskId: response.riskId,
        riskLimitValue: response.riskLimitValue,
        side: response.side,
        size: response.size,
        stopLoss: response.stopLoss,
        symbol: response.symbol,
        takeProfit: response.takeProfit,
        tpslMode: response.tpslMode,
        tradeMode: response.tradeMode,
        trailingStop: response.trailingStop,
        unrealisedPnl: response.unrealisedPnl
    };
  };

  