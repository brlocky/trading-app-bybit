import React, { useEffect } from "react";
import CardStats from "../components/Cards/CardStats";
import CardPositions from "../components/Cards/CardPositions";
import { connectAndListenToAccountWebsocketEvents } from "../utils/websocket"; // Import the WebSocket utility
import { SettingsService } from "../services";

const PositionsPage: React.FC = () => {
  useEffect(() => {
    const { apiKey, apiSecret } = SettingsService.loadSettings();
    // Call the WebSocket function with your API key, API secret, and API market
    connectAndListenToAccountWebsocketEvents({ apiKey, apiSecret }); // replace with your own API key, API secret, and API market
  }, []);

  return (
    <>
      <CardStats />
      <CardPositions />
    </>
  );
};

export default PositionsPage;
