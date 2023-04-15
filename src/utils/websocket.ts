import { WebsocketClient } from "bybit-api";

interface wsConfig {
  apiKey: string;
  apiSecret: string;
}

// Function to connect and listen to account WebSocket events
export const connectAndListenToAccountWebsocketEvents = (config: wsConfig) => {
  //   const wsClient = new WebsocketClient({
  //     key: apiKey,
  //     secret: apiSecret,
  //     market: apiMarket,
  //     testnet: true, // assuming you have 'testnet' defined somewhere
  //   });

  //   // WebSocket event handlers
  //   wsClient.on("update", (data) => {
  //     console.log("ws event: ", JSON.stringify(data, null, 2));
  //     // Handle update event data here
  //   });

  //   wsClient.on("open", (data) => {
  //     console.log("ws connection opened:", data.wsKey);
  //     // Handle open event data here
  //   });

  //   wsClient.on("response", (data) => {
  //     console.log("ws response: ", JSON.stringify(data, null, 2));
  //     // Handle response event data here
  //   });

  //   wsClient.on("reconnect", ({ wsKey }) => {
  //     console.log("ws automatically reconnecting.... ", wsKey);
  //     // Handle reconnect event data here
  //   });

  //   wsClient.on("reconnected", (data) => {
  //     console.log("ws has reconnected ", data?.wsKey);
  //     // Handle reconnected event data here
  //   });

  //   // Subscribe to private endpoints
  //   wsClient.subscribe(["position", "execution", "order", "wallet"]);

  const ws = new WebsocketClient({ key: config.apiKey, secret: config.apiSecret, market: "v5" });

  // (before v5) subscribe to multiple topics at once
  ws.subscribe(["position", "execution", "trade"]);

  // (before v5) and/or subscribe to individual topics on demand
  ws.subscribe("kline.BTCUSD.1m");

  // (v5) subscribe to multiple topics at once
  ws.subscribeV5(["orderbook.50.BTCUSDT", "orderbook.50.ETHUSDT"], "linear");

  // (v5) and/or subscribe to individual topics on demand
  ws.subscribeV5("position", "linear");
  ws.subscribeV5("publicTrade.BTC", "option");

  // Listen to events coming from websockets. This is the primary data source
  ws.on("update", (data: unknown) => {
    console.log("update", data);
  });

  // Optional: Listen to websocket connection open event (automatic after subscribing to one or more topics)
//   ws.on("open", ({ wsKey, event }) => {
//     console.log(event);
//     console.log("connection open for websocket with ID: " + wsKey);
//   });

  // Optional: Listen to responses to websocket queries (e.g. the response after subscribing to a topic)
  ws.on("response", (response: unknown) => {
    console.log("response", response);
  });

  // Optional: Listen to connection close event. Unexpected connection closes are automatically reconnected.
  ws.on("close", () => {
    console.log("connection closed");
  });

  // Optional: Listen to raw error events. Recommended.
  ws.on("error", (err: unknown) => {
    console.error("error", err);
  });
};
