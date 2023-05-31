import React, { ComponentType, useEffect } from 'react';
import { useApi } from '../providers';
import { LinearPositionIdx } from 'bybit-api';
import { mapApiToWsPositionV5Response } from '../mappers';
import { IOrder, IPosition } from '../types';
import { isOrderStopLossOrTakeProfit } from '../utils/tradeUtils';
import { DataService, IDataService, ITradingService, TradingService } from '../services';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectSymbol,
  selectOrders,
  selectTicker,
  selectTickerInfo,
  updateOrder,
  updatePositions,
  updateWallet,
  updateOrders,
} from '../slices/symbolSlice';
import { AppDispatch } from '../store';
import { toast } from 'react-toastify';
import { selectStopLosses, selectTakeProfits } from '../slices';

const accountType = 'CONTRACT';

export interface WithTradingControlProps {
  tradingService: ITradingService;
  dataService: IDataService;
  openLongTrade: (positionSize: string, price?: number) => Promise<void>;
  openMarketLongTrade: (positionSize: string) => Promise<void>;
  openMarketShortTrade: (positionSize: string) => Promise<void>;
  closeLongTrade: (positionSize: string, price?: number) => Promise<void>;
  openShortTrade: (positionSize: string, price?: number) => Promise<void>;
  closeShortTrade: (positionSize: string, price?: number) => Promise<void>;
  closeAllOrders: () => void;
  closePosition: (position: IPosition, qty: string) => Promise<void>;
  cancelOrder: (order: IOrder) => Promise<void>;
  toggleChase: (order: IOrder) => Promise<void>;
  addStopLoss: (symbol: string, positionSide: LinearPositionIdx, price: number) => Promise<void>;
}

function withTradingControl<P extends WithTradingControlProps>(
  WrappedComponent: ComponentType<P>,
): React.FC<Omit<P, keyof WithTradingControlProps>> {
  const WithTradingControl: React.FC<Omit<P, keyof WithTradingControlProps>> = (props) => {
    const symbol = useSelector(selectSymbol);
    const orders = useSelector(selectOrders);
    const ticker = useSelector(selectTicker);
    const tickerInfo = useSelector(selectTickerInfo);
    const takeProfits = useSelector(selectTakeProfits);
    const stopLosses = useSelector(selectStopLosses);

    const dispatch = useDispatch<AppDispatch>();

    const apiClient = useApi(); // Use the useApi hook to access the API context
    useEffect(() => {
      reloadTradingInfo();
    }, [tickerInfo]);

    const reloadTradingInfo = () => {
      if (!symbol) return;

      const activeOrdersPromise = apiClient.getActiveOrders({
        category: 'linear',
        symbol: symbol,
      });

      const positionInfoPromise = apiClient.getPositionInfo({
        category: 'linear',
        symbol: symbol,
      });

      const walletInfoPromise = apiClient.getWalletBalance({
        accountType: accountType,
        coin: 'USDT',
      });

      Promise.all([activeOrdersPromise, positionInfoPromise, walletInfoPromise]).then(([orderInfo, positionInfo, walletInfo]) => {
        orderInfo.retCode === 0 ? dispatch(updateOrders(orderInfo.result.list)) : toast.error('loading orders')
        positionInfo.retCode === 0 ? dispatch(updatePositions(positionInfo.result.list.map(mapApiToWsPositionV5Response))) : toast.error('updatding position')
        
        const usdtWallet = walletInfo.result.list[0];
        if (usdtWallet) {
          dispatch(updateWallet(usdtWallet));
        }
      });
    };

    const cancelOrder = async (order: IOrder) => {
      apiClient
        .cancelOrder({
          category: 'linear',
          symbol: order.symbol,
          orderId: order.orderId,
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        })
        .finally(() => {
          reloadTradingInfo();
        });
    };

    const toggleChase = async (order: IOrder) => {
      dispatch(updateOrder({ ...order, chase: !order.chase }));
    };

    const closeAllOrders = () => {
      orders.filter((o) => !isOrderStopLossOrTakeProfit(o)).map(cancelOrder);
      reloadTradingInfo();
    };

    const openLongTrade = async (positionSize: string, price?: number) => {
      if (!ticker || !tickerInfo) {
        return;
      }
      const nearPrice = price ? price : parseFloat(ticker.bid1Price);

      const tp = takeProfits[0].price;
      const sl = stopLosses[0].price;
      apiClient
        .submitOrder({
          positionIdx: LinearPositionIdx.BuySide,
          category: 'linear',
          symbol: tickerInfo.symbol,
          side: 'Buy',
          orderType: 'Limit',
          qty: positionSize,
          price: nearPrice.toString(),
          timeInForce: 'PostOnly',
          takeProfit: tp.toFixed(Number(tickerInfo.priceScale)),
          stopLoss: sl.toFixed(Number(tickerInfo.priceScale)),
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        })
        .finally(() => {
          reloadTradingInfo();
        });
    };

    const openMarketLongTrade = async (positionSize: string) => {
      if (!ticker || !tickerInfo) {
        return;
      }

      const tp = takeProfits[0].price;
      const sl = stopLosses[0].price;
      console.log(tp, sl, tickerInfo.priceScale);
      const nearPrice = parseFloat(ticker.ask1Price);
      apiClient
        .submitOrder({
          positionIdx: LinearPositionIdx.OneWayMode,
          category: 'linear',
          symbol: tickerInfo.symbol,
          side: 'Buy',
          orderType: 'Market',
          qty: positionSize,
          price: nearPrice.toString(),
          timeInForce: 'GTC',
          takeProfit: tp.toFixed(Number(tickerInfo.priceScale)),
          stopLoss: sl.toFixed(Number(tickerInfo.priceScale)),
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        })
        .finally(() => {
          reloadTradingInfo();
        });
    };

    const openMarketShortTrade = async (positionSize: string) => {
      if (!ticker || !symbol) {
        return;
      }
      const nearPrice = parseFloat(ticker.bid1Price);
      apiClient
        .submitOrder({
          positionIdx: LinearPositionIdx.SellSide,
          category: 'linear',
          symbol: symbol,
          side: 'Sell',
          orderType: 'Market',
          qty: positionSize,
          price: nearPrice.toString(),
          timeInForce: 'GTC',
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        })
        .finally(() => {
          reloadTradingInfo();
        });
    };

    const closeLongTrade = async (qty: string, price?: number) => {
      if (!ticker || !symbol) {
        return;
      }

      const nearPrice = price ? price : parseFloat(ticker.ask1Price);
      apiClient
        .submitOrder({
          positionIdx: LinearPositionIdx.BuySide,
          category: 'linear',
          symbol: symbol,
          side: 'Sell',
          orderType: 'Limit',
          qty: qty,
          price: nearPrice.toString(),
          timeInForce: 'PostOnly',
          reduceOnly: true,
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        })
        .finally(() => {
          reloadTradingInfo();
        });
    };

    const openShortTrade = async (positionSize: string, price?: number) => {
      if (!ticker || !symbol) {
        return;
      }
      const nearPrice = price ? price : ticker.ask1Price;
      apiClient
        .submitOrder({
          positionIdx: LinearPositionIdx.SellSide,
          category: 'linear',
          symbol: symbol,
          side: 'Sell',
          orderType: 'Limit',
          qty: positionSize,
          price: nearPrice.toString(),
          timeInForce: 'PostOnly',
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        })
        .finally(() => {
          reloadTradingInfo();
        });
    };

    const closeShortTrade = async (qty: string, price?: number) => {
      if (!ticker || !symbol) {
        return;
      }

      const nearPrice = price ? price : parseFloat(ticker.bid1Price);
      apiClient
        .submitOrder({
          positionIdx: LinearPositionIdx.SellSide,
          category: 'linear',
          symbol: symbol,
          side: 'Buy',
          orderType: 'Limit',
          qty: qty,
          price: nearPrice.toString(),
          timeInForce: 'PostOnly',
          reduceOnly: true,
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        })
        .finally(() => {
          reloadTradingInfo();
        });
    };

    const closePosition = async (position: IPosition, qty: string) => {
      if (!ticker) {
        return;
      }

      const nearPrice = position.positionIdx === LinearPositionIdx.BuySide ? ticker.ask1Price : ticker.bid1Price;
      apiClient
        .submitOrder({
          positionIdx: position.positionIdx,
          category: 'linear',
          symbol: position.symbol,
          side: position.positionIdx === LinearPositionIdx.BuySide ? 'Sell' : 'Buy',
          orderType: 'Limit',
          qty: qty,
          price: nearPrice,
          timeInForce: 'PostOnly',
          reduceOnly: true,
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        })
        .finally(() => {
          reloadTradingInfo();
        });
    };

    const addStopLoss = async (symbol: string, positionSide: LinearPositionIdx, price: number) => {
      apiClient
        .setTradingStop({
          positionIdx: positionSide,
          category: 'linear',
          symbol: symbol,
          stopLoss: price.toString(),
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        })
        .finally(() => {
          reloadTradingInfo();
        });
    };

    const tradingService = TradingService(apiClient);
    const dataService = DataService(apiClient);

    return (
      <WrappedComponent
        {...(props as P)}
        tradingService={tradingService}
        dataService={dataService}
        openLongTrade={openLongTrade}
        openMarketLongTrade={openMarketLongTrade}
        closeLongTrade={closeLongTrade}
        openShortTrade={openShortTrade}
        openMarketShortTrade={openMarketShortTrade}
        closeShortTrade={closeShortTrade}
        closeAllOrders={closeAllOrders}
        closePosition={closePosition}
        cancelOrder={cancelOrder}
        toggleChase={toggleChase}
        addStopLoss={addStopLoss}
      />
    );
  };

  return WithTradingControl;
}

export default withTradingControl;
