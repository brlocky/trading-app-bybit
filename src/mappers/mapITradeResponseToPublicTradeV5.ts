import { OrderSideV5, PublicTradeV5 } from 'bybit-api';
import { ITradeResponse } from '../types';

export const mapITradeResponseToPublicTradeV5 = (tradeResponse: ITradeResponse): PublicTradeV5 => {
  return {
    execId: tradeResponse.i,
    symbol: tradeResponse.s,
    price: tradeResponse.p,
    size: tradeResponse.v,
    side: tradeResponse.S as OrderSideV5, // Assuming OrderSideV5 is a valid type
    time: tradeResponse.T.toString(),
    isBlockTrade: tradeResponse.BT,
  };
};
