import React, { useEffect, useState } from "react";
import CardPositions from "../components/Cards/CardPositions";
import {
  InstrumentInfoResponseV5,
  LinearPositionIdx,
  WalletBalanceV5,
  WebsocketClient,
} from "bybit-api";
import { IOrder, IPosition, ITicker, IWsResponseData } from "../types";
import { useApi, useWebSocket } from "../providers";
import { mapApiToWsPositionV5Response } from "../mappers";
import CardTrade from "../components/Cards/CardTrade";
import CardSymbol from "../components/Cards/CardSymbol";
import CardOrders from "../components/Cards/CardOrders";
import Button from "../components/Button/Button";

const symbol = "BTCUSDT";
const accountType = "CONTRACT";

const PositionsPage: React.FC = () => {
  const [positions, setPositions] = useState<IPosition[]>([]);
  const [openOrders, setOpenOrders] = useState<IOrder[]>([]);
  const [wallet, setWallet] = useState<WalletBalanceV5>();
  const [price, setPrice] = useState<ITicker>();

  const [instrumentInfo, setInstrumentInfo] =
    useState<InstrumentInfoResponseV5>();

  const apiClient = useApi(); // Use the useApi hook to access the API context

  const webSocketClient = useWebSocket();

  useEffect(() => {
    loadOrders();

    // Symbol ticker and step
    apiClient
      .getInstrumentsInfo({
        category: "linear",
        symbol: symbol,
      })
      .then((info) => {
        setInstrumentInfo(info.result);
      });

    // Get USDT Wallet Balance
    apiClient
      .getWalletBalance({
        accountType: accountType,
        coin: "USDT",
      })
      .then((res) => {
        const usdtWallet = res.result.list[0];
        if (usdtWallet) {
          setWallet(usdtWallet);
        }
      });
  }, []);

  useEffect(() => {
    webSocketClient.addListener("update", socketUpdate);

    return () => {
      webSocketClient.removeListener("update", socketUpdate);
    };
  }, [price]);

  const loadOrders = () => {
    // Get current orders Info
    apiClient
      .getActiveOrders({
        category: "linear",
        symbol: symbol,
      })
      .then((orderInfo) => {
        setOpenOrders(orderInfo.result.list);
      });

    // Get current positions Info
    apiClient
      .getPositionInfo({
        category: "linear",
        symbol: symbol,
      })
      .then((positionInfo) => {
        setPositions(
          positionInfo.result.list.map(mapApiToWsPositionV5Response)
        );
      });
  };

  const socketUpdate = (res: IWsResponseData<any>) => {
    switch (res.topic) {
      case "position":
        setPositions(res.data);
        break;

      case `tickers.${symbol}`:
        if (res.data.lastPrice) {
          setPrice((price) => {
            amendOrder();
            return res.data;
          });
        }
        break;

      case "wallet":
        if (res.data[0]) {
          setWallet(res.data[0]);
        }
        break;

      case "order":
        syncOrders(res.data);
        break;

      case "execution":
        console.log("execution");
        console.log(res.data);
        break;

      default:
        console.error("Unknown socket update");
        console.error(res.topic, res.data);
    }
  };

  const syncOrders = (changedOrders: IOrder[]) => {
    setOpenOrders((currentOrders) => {
      changedOrders.forEach((changedOrder) => {
        const index = currentOrders.findIndex(
          (o) => o.orderId === changedOrder.orderId
        );
        if (index !== -1) {
          currentOrders[index] = changedOrder;
        }
      });
      return currentOrders;
    });
  };

  const cancelOrder = async (order: IOrder) => {
    apiClient
      .cancelOrder({
        category: "linear",
        symbol: order.symbol,
        orderId: order.orderId,
      })
      .then((_) => {
        loadOrders();
      });
  };

  const closeAllOrders = () => {
    openOrders.map(cancelOrder);
  };

  const openLongTrade = async () => {
    if (!price) {
      return;
    }
    const nearPrice = parseFloat(price.lastPrice) - 5;
    apiClient
      .submitOrder({
        positionIdx: LinearPositionIdx.BuySide,
        category: "linear",
        symbol: symbol,
        side: "Buy",
        orderType: "Limit",
        qty: "0.001",
        price: nearPrice.toString(),
        timeInForce: "PostOnly",
      })
      .then((orderResult) => {
        loadOrders();
      })
      .catch((e) => {
        console.log("Error openning order");
        console.log(e);
      })
      .finally(() => {});
  };

  const closeLongTrade = async () => {
    if (!price) {
      return;
    }
    const nearPrice = parseFloat(price.lastPrice) + 5;
    apiClient
      .submitOrder({
        positionIdx: LinearPositionIdx.BuySide,
        category: "linear",
        symbol: symbol,
        side: "Sell",
        orderType: "Limit",
        qty: "0.001",
        price: nearPrice.toString(),
        timeInForce: "PostOnly",
      })
      .then((orderResult) => {
        loadOrders();
      })
      .catch((e) => {
        console.log("Error openning order");
        console.log(e);
      })
      .finally(() => {});
  };

  const openShortTrade = async () => {
    if (!price) {
      return;
    }
    const nearPrice = parseFloat(price.lastPrice) + 5;
    apiClient
      .submitOrder({
        positionIdx: LinearPositionIdx.SellSide,
        category: "linear",
        symbol: symbol,
        side: "Sell",
        orderType: "Limit",
        qty: "0.001",
        price: nearPrice.toString(),
        timeInForce: "PostOnly",
      })
      .then((orderResult) => {
        loadOrders();
      })
      .catch((e) => {
        console.log("Error openning order");
        console.log(e);
      })
      .finally(() => {});
  };

  const closeShortTrade = async () => {
    if (!price) {
      return;
    }
    const nearPrice = parseFloat(price.lastPrice) - 15;
    apiClient
      .submitOrder({
        positionIdx: LinearPositionIdx.SellSide,
        category: "linear",
        symbol: symbol,
        side: "Buy",
        orderType: "Limit",
        qty: "0.001",
        price: nearPrice.toString(),
        timeInForce: "PostOnly",
      })
      .then((orderResult) => {
        loadOrders();
      })
      .catch((e) => {
        console.log("Error openning order");
        console.log(e);
      })
      .finally(() => {});
  };

  let workingAmendOrder: boolean = false;
  const amendOrder = () => {
    if (workingAmendOrder || !price) {
      return;
    }

    const order = [...openOrders].pop();
    if (!order) {
      return;
    }

    let nearPrice = 0;

    if (order.side === "Sell") {
      nearPrice = parseFloat(price.lastPrice) + 0.1;
      if (parseFloat(nearPrice.toFixed(2)) >= parseFloat(order.price)) {
        return;
      }
    }

    if (order.side === "Buy") {
      nearPrice = parseFloat(price.lastPrice) - 0.1;
      if (parseFloat(nearPrice.toFixed(2)) <= parseFloat(order.price)) {
        return;
      }
    }

    if (nearPrice === 0) {
      return;
    }

    workingAmendOrder = true;

    apiClient
      .amendOrder({
        orderId: order.orderId,
        category: "linear",
        symbol: symbol,
        price: nearPrice.toFixed(2),
      })
      .then((i) => {
        console.log("order changed ", i.retMsg, price.lastPrice, nearPrice);
      })
      .catch((e) => {
        console.log("Error changing order");
        console.log(e);
      })
      .finally(() => {
        setTimeout(() => {
          workingAmendOrder = false;
          loadOrders();
        }, 500);
      });
  };

  if (!price) {
    return <></>;
  }

  return (
    <>
      <CardSymbol symbolInfo={instrumentInfo} wallet={wallet} price={price} />
      <CardPositions positions={positions} price={price} />
      {/* <CardOrders orders={openOrders} cancelOrder={cancelOrder} /> */}
      <CardTrade
        longTrade={openLongTrade}
        closeLongTrade={closeLongTrade}
        shortTrade={openShortTrade}
        closeShortTrade={closeShortTrade}
        closeAll={closeAllOrders}
      />

      {/* <pre>{JSON.stringify(instrumentInfo, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(price, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(wallets, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(openOrders, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
    </>
  );
};

export default PositionsPage;
