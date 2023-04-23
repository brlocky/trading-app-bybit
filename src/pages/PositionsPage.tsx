import React, { useContext, useEffect, useState } from 'react';
import CardPositions from '../components/Cards/CardPositions';
import { LinearInverseInstrumentInfoV5, LinearPositionIdx } from 'bybit-api';
import { IOrder, IPosition } from '../types';
import { useApi } from '../providers';
import { mapApiToWsPositionV5Response } from '../mappers';
import CardSymbol from '../components/Cards/CardSymbol';
import CardOrders from '../components/Cards/CardOrders';
import SocketContext from '../contexts/SocketContext';

const symbol = 'BTCUSDT';
const accountType = 'CONTRACT';

const PositionsPage: React.FC = () => {
  const [positionSize, setPositionSize] = useState<number>(0.001);

  const apiClient = useApi(); // Use the useApi hook to access the API context

  // const webSocketClient = useWebSocket();

  const {
    SocketState: { orders, positions, ticker, tickerInfo, executions, wallet },
    SocketDispatch,
  } = useContext(SocketContext);

  useEffect(() => {
    loadOrders();

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
  }, []);

  useEffect(() => {
    let workingAmendOrder = false;
    if (workingAmendOrder || !ticker) {
      return;
    }

    const order = [...orders.filter(o => o.chase)].pop();

    console.log('order to chase');
    console.log(order);
    if (!order) {
      return;
    }

    let nearPrice = ticker.markPrice;
    if (
      order.positionIdx === LinearPositionIdx.BuySide &&
      order.side === 'Buy'
    ) {
      console.log('Open Long');
      nearPrice = ticker.bid1Price;
      if (parseFloat(nearPrice) <= parseFloat(order.price)) {
        return;
      }
    }

    if (
      order.positionIdx === LinearPositionIdx.BuySide &&
      order.side === 'Sell'
    ) {
      console.log('Close Long');
      nearPrice = ticker.ask1Price;
      if (parseFloat(nearPrice) >= parseFloat(order.price)) {
        return;
      }
    }

    if (
      order.positionIdx === LinearPositionIdx.SellSide &&
      order.side === 'Sell'
    ) {
      console.log('Open Short');
      nearPrice = ticker.ask1Price;
      if (parseFloat(nearPrice) >= parseFloat(order.price)) {
        return;
      }
    }

    if (
      order.positionIdx === LinearPositionIdx.SellSide &&
      order.side === 'Buy'
    ) {
      console.log('Close Short');
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
          loadOrders();
        }, 1000);
      });
  }, [ticker]);

  const loadOrders = () => {
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
  };

  const cancelOrder = async (order: IOrder) => {
    apiClient
      .cancelOrder({
        category: 'linear',
        symbol: order.symbol,
        orderId: order.orderId,
      })
      .then((_) => {
        loadOrders();
      });
  };

  const toggleChase = async (order: IOrder) => {
    SocketDispatch({type: 'update_order', payload: {...order, chase: !order.chase}})
  };
  

  const closeAllOrders = () => {
    orders.map(cancelOrder);
  };

  const openLongTrade = async () => {
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
        qty: positionSize.toString(),
        price: nearPrice.toString(),
        timeInForce: 'GTC',
      })
      .then((orderResult) => {
        loadOrders();
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const openShortTrade = async () => {
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
        qty: positionSize.toString(),
        price: ticker.ask1Price,
        timeInForce: 'PostOnly',
      })
      .then((orderResult) => {
        loadOrders();
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const closeTrade = async (position: IPosition, qty: number) => {
    if (!ticker) {
      return;
    }

    console.log('Close', qty.toFixed(3));
    const nearPrice =
      position.positionIdx === LinearPositionIdx.BuySide
        ? ticker.ask1Price
        : ticker.bid1Price;
    apiClient
      .submitOrder({
        positionIdx: position.positionIdx,
        category: 'linear',
        symbol: position.symbol,
        side:
          position.positionIdx === LinearPositionIdx.BuySide ? 'Sell' : 'Buy',
        orderType: 'Limit',
        qty: qty.toFixed(3),
        price: nearPrice,
        timeInForce: 'PostOnly',
      })
      .then((orderResult) => {
        console.log(orderResult);
        loadOrders();
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {});
  };

  if (!ticker) {
    return <></>;
  }

  return (
    <>
      <CardSymbol
        symbolInfo={tickerInfo}
        wallet={wallet}
        price={ticker}
        positionSizeUpdated={(s) => setPositionSize(s)}
        longTrade={openLongTrade}
        shortTrade={openShortTrade}
        closeAll={closeAllOrders}
      />

      <CardPositions
        positions={positions}
        price={ticker}
        closeTrade={closeTrade}
      />
      <CardOrders orders={orders} cancelOrder={cancelOrder} toggleChase={toggleChase} />

      {/* <pre>{JSON.stringify(ticker, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(tickerInfo, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(price, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(wallets, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(orders, null, 2)}</pre> */}

      {/* <pre>{JSON.stringify(executions, null, 2)}</pre>
      <pre>{JSON.stringify(wallet, null, 2)}</pre>*/}
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre>  */}
    </>
  );
};

export default PositionsPage;
