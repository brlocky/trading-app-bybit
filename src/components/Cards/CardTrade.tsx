import React from "react";
import { Card } from "./Card";
import Button from "../Button/Button";

interface ICardTradeProps {
  longTrade: () => void;
  closeLongTrade: () => void;
  shortTrade: () => void;
  closeShortTrade: () => void;
  closeAll: () => void;
}

const CardTrade = ({ longTrade, closeLongTrade, shortTrade, closeShortTrade, closeAll }: ICardTradeProps) => {
  return (
    <>
      <Card header={"Trade"}>
        <div className="flex flex-col w-full">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
                <div className="flex justify-center">
                  <Button onClick={longTrade}>Long</Button>
                  <Button onClick={closeLongTrade}>Close Long</Button>
                  <Button onClick={shortTrade}>Short</Button>
                  <Button onClick={closeShortTrade}>Close Short</Button>
                  <Button onClick={closeAll}>Close All Orders</Button>
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
