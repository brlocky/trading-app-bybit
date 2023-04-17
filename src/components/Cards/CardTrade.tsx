import React from "react";
import { Card } from "./Card";
import { useApi } from "../../providers";
import Button from "../Button/Button";
import { LinearPositionIdx } from "bybit-api";

interface CardTradeProps {
  price: string;
  symbol: string;
  positionSize: string;
}

const CardTrade = ({ price, symbol, positionSize }: CardTradeProps) => {
  const apiClient = useApi(); // Use the useApi hook to access the API context

  const openLongTrade = () => {
    console.log("openLongTrade");
    apiClient
      .submitOrder({
        positionIdx: LinearPositionIdx.BuySide,
        category: "linear",
        symbol: symbol,
        side: "Buy",
        orderType: "Limit",
        qty: positionSize,
        price: price,
        // triggerDirection: 1,
      })
      .then(r => console.log(r))
      .catch((e) => console.log('Error >>> ', e));
  };

  return (
    <>
      <Card header={"Trade"}>
        <div className="flex flex-col w-full">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <div className="flex justify-center">
                  <Button onClick={openLongTrade}>Long</Button>
                  <Button>Short</Button>
                  <Button>Close All Positions</Button>
                  <Button>Reload</Button>
                </div>
              </div>
            </div>
          </div>
          {/* <pre>{JSON.stringify(trade, null, 2)}</pre> */}
        </div>
      </Card>
    </>
  );
};

export default CardTrade;
