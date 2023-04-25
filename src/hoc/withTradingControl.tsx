import React, { ComponentType, useContext, useEffect } from 'react';
import { useApi } from '../providers';
import SocketContext from '../contexts/SocketContext';
import { LinearInverseInstrumentInfoV5, LinearPositionIdx, WalletBalanceV5 } from 'bybit-api';
import { mapApiToWsPositionV5Response } from '../mappers';
import { IOrder, IPosition, ITicker } from '../types';

const symbol = 'BTCUSDT';
const accountType = 'CONTRACT';

export interface WithTradingControlProps {
  openLongTrade: (positionSize: string) => Promise<void>;
  openShortTrade: (positionSize: string) => Promise<void>;
  closeAllOrders: () => void;
  closeTrade: (position: IPosition, qty: string) => Promise<void>;
  cancelOrder: (order: IOrder) => Promise<void>;
  toggleChase: (order: IOrder) => Promise<void>;
  positions: IPosition[];
  tickerInfo: LinearInverseInstrumentInfoV5;
  wallet: WalletBalanceV5;
  orders: IOrder[];
  ticker: ITicker;
}

function withTradingControl<P extends WithTradingControlProps>(
  WrappedComponent: ComponentType<P>,
): React.FC<Omit<P, keyof WithTradingControlProps>> {
  const WithTradingControl: React.FC<Omit<P, keyof WithTradingControlProps>> = (props) => {
    const {
      SocketState: { orders, positions, ticker, tickerInfo, wallet },
      SocketDispatch,
    } = useContext(SocketContext);

    const apiClient = useApi(); // Use the useApi hook to access the API context
    useEffect(() => {
      loadTradingInfo();

      // Symbol ticker and step
      apiClient
        .getInstrumentsInfo({
          category: 'linear',
          symbol: symbol,
        })
        .then((info) => {
          SocketDispatch({
            type: 'update_ticker_info',
            payload: info.result.list[0] as LinearInverseInstrumentInfoV5,
          });
        });
    }, []);

    useEffect(() => {
      let workingAmendOrder = false;
      if (workingAmendOrder || !ticker) {
        return;
      }

      const ammendOrders = [...orders.filter((o) => o.chase)];

      if (!ammendOrders.length) {
        return;
      }

      ammendOrders.forEach((order) => {
        let nearPrice = ticker.markPrice;
        if (order.positionIdx === LinearPositionIdx.BuySide && order.side === 'Buy') {
          nearPrice = ticker.bid1Price;
          if (parseFloat(nearPrice) <= parseFloat(order.price)) {
            return;
          }
        }

        if (order.positionIdx === LinearPositionIdx.BuySide && order.side === 'Sell') {
          nearPrice = ticker.ask1Price;
          if (parseFloat(nearPrice) >= parseFloat(order.price)) {
            return;
          }
        }

        if (order.positionIdx === LinearPositionIdx.SellSide && order.side === 'Sell') {
          nearPrice = ticker.ask1Price;
          if (parseFloat(nearPrice) >= parseFloat(order.price)) {
            return;
          }
        }

        if (order.positionIdx === LinearPositionIdx.SellSide && order.side === 'Buy') {
          nearPrice = ticker.bid1Price;
          if (parseFloat(nearPrice) <= parseFloat(order.price)) {
            return;
          }
        }

        workingAmendOrder = true;
        apiClient
          .amendOrder({
            orderId: order.orderId,
            category: 'linear',
            symbol: symbol,
            price: nearPrice,
          })
          .then((i) => {
            console.log('order changed ', i.retMsg);
          })
          .catch((e) => {
            console.log(e);
          })
          .finally(() => {
            setTimeout(() => {
              workingAmendOrder = false;
              loadTradingInfo();
            }, 100);
          });
      });
    }, [ticker]);

    const loadTradingInfo = () => {
      // Get current orders Info
      apiClient
        .getActiveOrders({
          category: 'linear',
          symbol: symbol,
        })
        .then((orderInfo) => {
          SocketDispatch({
            type: 'update_orders',
            payload: orderInfo.result.list,
          });
        });

      // Get current positions Info
      apiClient
        .getPositionInfo({
          category: 'linear',
          symbol: symbol,
        })
        .then((positionInfo) => {
          SocketDispatch({
            type: 'update_positions',
            payload: positionInfo.result.list.map(mapApiToWsPositionV5Response),
          });
        });

      // Get USDT Wallet Balance
      apiClient
        .getWalletBalance({
          accountType: accountType,
          coin: 'USDT',
        })
        .then((res) => {
          const usdtWallet = res.result.list[0];
          if (usdtWallet) {
            SocketDispatch({
              type: 'update_wallet',
              payload: usdtWallet,
            });
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
        .then(() => {
          loadTradingInfo();
        });
    };

    const toggleChase = async (order: IOrder) => {
      SocketDispatch({ type: 'update_order', payload: { ...order, chase: !order.chase } });
    };

    const closeAllOrders = () => {
      orders.map(cancelOrder);
      loadTradingInfo();
    };

    const openLongTrade = async (positionSize: string) => {
      if (!ticker) {
        return;
      }
      const nearPrice = parseFloat(ticker.lastPrice) - 1;
      apiClient
        .submitOrder({
          positionIdx: LinearPositionIdx.BuySide,
          category: 'linear',
          symbol: symbol,
          side: 'Buy',
          orderType: 'Limit',
          qty: positionSize,
          price: nearPrice.toString(),
          timeInForce: 'PostOnly',
        })
        .then(() => {
          loadTradingInfo();
        })
        .catch((e) => {
          console.log(e);
        });
    };

    const openShortTrade = async (positionSize: string) => {
      if (!ticker) {
        return;
      }
      apiClient
        .submitOrder({
          positionIdx: LinearPositionIdx.SellSide,
          category: 'linear',
          symbol: symbol,
          side: 'Sell',
          orderType: 'Limit',
          qty: positionSize,
          price: ticker.ask1Price,
          timeInForce: 'PostOnly',
        })
        .then(() => {
          loadTradingInfo();
        })
        .catch((e) => {
          console.log(e);
        });
    };

    const closeTrade = async (position: IPosition, qty: string) => {
      if (!ticker) {
        return;
      }

      const nearPrice =
        position.positionIdx === LinearPositionIdx.BuySide ? ticker.ask1Price : ticker.bid1Price;
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
        })
        .then(() => {
          loadTradingInfo();
        })
        .catch((e) => {
          console.log(e);
        });
    };

    return (
      <WrappedComponent
        {...(props as P)}
        openLongTrade={openLongTrade}
        openShortTrade={openShortTrade}
        closeAllOrders={closeAllOrders}
        closeTrade={closeTrade}
        cancelOrder={cancelOrder}
        toggleChase={toggleChase}
        positions={positions}
        tickerInfo={tickerInfo}
        wallet={wallet}
        orders={orders}
        ticker={ticker}
      />
    );
  };

  return WithTradingControl;
}

export default withTradingControl;
