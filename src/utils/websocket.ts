import { WS_KEY_MAP, WebsocketClient } from "bybit-api";

interface wsConfig {
  apiKey: string;
  apiSecret: string;
}

class WebsocketManager {
  private static instance: WebsocketManager;
  private ws: WebsocketClient;

  private constructor(config: wsConfig) {
    this.ws = new WebsocketClient({
      key: config.apiKey,
      secret: config.apiSecret,
      market: "v5",
    });

    this.ws.on("close", () => {
      console.log("connection closed");
    });

    this.ws.on("error", (err: unknown) => {
      console.error("error", err);
    });

    setTimeout(() => {
        const activePrivateTopics = this.ws
          .getWsStore()
          .getTopics(WS_KEY_MAP.v5Private);
        console.log('Active private v5 topics: ', activePrivateTopics);
      
        const activePublicLinearTopics = this.ws
          .getWsStore()
          .getTopics(WS_KEY_MAP.v5LinearPublic);
        console.log('Active public linear v5 topics: ', activePublicLinearTopics);
      
        const activePublicSpotTopis = this.ws
          .getWsStore()
          .getTopics(WS_KEY_MAP.v5SpotPublic);
        console.log('Active public spot v5 topics: ', activePublicSpotTopis);
      
        const activePublicOptionsTopics = this.ws
          .getWsStore()
          .getTopics(WS_KEY_MAP.v5OptionPublic);
        console.log('Active public option v5 topics: ', activePublicOptionsTopics);
      }, 5 * 1000);
  }

  public static getInstance(config: wsConfig): WebsocketManager {
    if (!WebsocketManager.instance) {
      WebsocketManager.instance = new WebsocketManager(config);
    }
    return WebsocketManager.instance;
  }

  public getWebsocketClient(): WebsocketClient {
    return this.ws;
  }
}

export default WebsocketManager;
