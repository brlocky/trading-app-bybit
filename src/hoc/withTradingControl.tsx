import React, { ComponentType, useEffect } from 'react';
import { useApi } from '../providers';
import { LinearPositionIdx, OrderSideV5 } from 'bybit-api';
import { mapApiToWsPositionV5Response } from '../mappers';
import { IOrder } from '../types';
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
import { selectPositionMode, selectStopLosses, selectTakeProfits } from '../slices';

const accountType = 'CONTRACT';

export interface WithTradingControlProps {
  tradingService: ITradingService;
  dataService: IDataService;
  openMarketLongTrade: (positionSize: string) => Promise<void>;
  openMarketShortTrade: (positionSize: string) => Promise<void>;
  closeAllOrders: () => void;
  cancelOrder: (order: IOrder) => Promise<void>;
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
    const positionMode = useSelector(selectPositionMode);

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
        orderInfo.retCode === 0 ? dispatch(updateOrders(orderInfo.result.list)) : toast.error('loading orders');
        positionInfo.retCode === 0
          ? dispatch(updatePositions(positionInfo.result.list.map(mapApiToWsPositionV5Response)))
          : toast.error('updatding position');

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

    const closeAllOrders = () => {
      orders.filter((o) => !isOrderStopLossOrTakeProfit(o)).map(cancelOrder);
      reloadTradingInfo();
    };

    const openMarketLongTrade = async (positionSize: string) => {
      if (!ticker || !tickerInfo) {
        return;
      }

      const tp = takeProfits[0].price;
      const sl = stopLosses[0].price;
      const nearPrice = parseFloat(ticker.ask1Price);
      apiClient
        .submitOrder({
          positionIdx: getPositionMode('Buy'),
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
      if (!ticker || !tickerInfo) {
        return;
      }

      const tp = takeProfits[0].price;
      const sl = stopLosses[0].price;
      const nearPrice = parseFloat(ticker.bid1Price);
      apiClient
        .submitOrder({
          positionIdx: getPositionMode('Sell'),
          category: 'linear',
          symbol: tickerInfo.symbol,
          side: 'Sell',
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

    const getPositionMode = (type: OrderSideV5): LinearPositionIdx => {
      console.log('getPositionMode', type, positionMode, positionMode === 0 ? LinearPositionIdx.OneWayMode : type === 'Buy' ? LinearPositionIdx.BuySide : LinearPositionIdx.SellSide)
      return positionMode === 0 ? LinearPositionIdx.OneWayMode : type === 'Buy' ? LinearPositionIdx.BuySide : LinearPositionIdx.SellSide;
    };

    const tradingService = TradingService(apiClient);
    const dataService = DataService(apiClient);

    return (
      <WrappedComponent
        {...(props as P)}
        tradingService={tradingService}
        dataService={dataService}
        openMarketLongTrade={openMarketLongTrade}
        openMarketShortTrade={openMarketShortTrade}
        closeAllOrders={closeAllOrders}
        cancelOrder={cancelOrder}
      />
    );
  };

  return WithTradingControl;
}

export default withTradingControl;
