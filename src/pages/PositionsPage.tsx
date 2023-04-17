import React, { useEffect, useState } from "react";
import CardPositions from "../components/Cards/CardPositions";
import WebsocketManager from "../utils/websocket"; // Import the WebSocket utility
import { SettingsService } from "../services";
import { InstrumentInfoResponseV5, WalletBalanceV5 } from "bybit-api";
import { PositionWSV5, TickerV5, WsResponseData } from "../types";
import CardWallets from "../components/Cards/CardWallets";
import { useApi } from "../providers";
import { mapApiToWsPositionV5Response } from "../mappers";
import CardTrade from "../components/Cards/CardTrade";
import CardSymbol from "../components/Cards/CardSymbol";

const symbol = "BTCUSDT";
const accountType = "CONTRACT";

const PositionsPage: React.FC = () => {
  const [positions, setPositions] = useState<PositionWSV5[]>([]);
  const [wallet, setWallet] = useState<WalletBalanceV5>();
  const [price, setPrice] = useState<TickerV5>({
    symbol: symbol,
    lastPrice: "0",
  });

  const [instrumentInfo, setInstrumentInfo] = useState<
    InstrumentInfoResponseV5 | undefined
  >(undefined);

  const apiClient = useApi(); // Use the useApi hook to access the API context

  useEffect(() => {
    const { apiKey, apiSecret } = SettingsService.loadSettings();

    // Symbol ticker and step
    apiClient
      .getInstrumentsInfo({
        category: "linear",
        symbol: symbol,
      })
      .then((info) => {
        setInstrumentInfo(info.result);
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

    // Get the websocket client from the WebsocketManager
    const wsClient = WebsocketManager.getInstance({
      apiKey,
      apiSecret,
    }).getWebsocketClient();

    // Listen to events coming from websockets and update the state
    wsClient.on("update", (res: WsResponseData<any>) => {
      switch (res.topic) {
        case "position":
          setPositions(res.data);
          break;

        case `tickers.${symbol}`:
          if (res.data.lastPrice) {
            setPrice(res.data);
          }
          break;

        case "wallet":
          if (res.data[0]) {
            setWallet(res.data[0]);
          }

          break;

        default:
          console.log("Unknown update");
          console.log(res.topic, res.data);
      }
    });

    wsClient.subscribeV5(["position", "wallet"], "linear", true);
    wsClient.subscribeV5(`tickers.${symbol}`, "linear");
    // wsClient.subscribeV5("execution", "linear");
    // wsClient.subscribeV5(["order", "wallet", "greeks"], "linear");

    // Optional: Cleanup the websocket connection on component unmount
    return () => {
      // Remove the event listener
      wsClient.closeAll();
    };
  }, []);

  return (
    <>
      <CardSymbol symbolInfo={instrumentInfo} wallet={wallet} price={price} />
      <CardPositions positions={positions} price={price} />
      <CardTrade symbol={symbol} positionSize="0.001" price={price.lastPrice} />

      {/* <pre>{JSON.stringify(instrumentInfo, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(price, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(wallets, null, 2)}</pre> */}
    </>
  );
};

export default PositionsPage;
