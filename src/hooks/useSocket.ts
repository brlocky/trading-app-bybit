import { WebsocketClient } from "bybit-api";
import { useEffect, useRef } from "react";
import { SettingsService } from "../services";

export const useSocket = (): WebsocketClient => {
  const { apiKey, apiSecret } = SettingsService.loadSettings();

  const { current: socket } = useRef(
    new WebsocketClient({
          key: apiKey,
          secret: apiSecret,
          market: "v5",
      })
  );

  useEffect(() => {
    return () => {
      if (socket) {
        socket.closeAll();
      }
    };
  }, [socket]);

  return socket;
};
