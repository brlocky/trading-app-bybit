import React, { useState } from 'react';
import CardPositions from '../components/Cards/CardPositions';
import CardSymbol from '../components/Cards/CardSymbol';
import CardOrders from '../components/Cards/CardOrders';
import withTradingControl, { WithTradingControlProps } from '../hoc/withTradingControl';
import { TradingDom } from '../components/TradingDom';
import tw from 'twin.macro';

const PositionPageComponent = tw.div`
w-full
grid 
grid-flow-row-dense 
grid-cols-3
grid-rows-2
lg:grid-rows-1
`;

const LeftColumnComponent = tw.div`
flex
p-2
col-span-3
lg:col-span-1
lg:row-span-1
`;

const PositionPageContent = tw.div`
flex
flex-col
w-full
p-2
col-span-3
lg:col-span-2
lg:row-span-1
`;



const PositionsPageComponent: React.FC<WithTradingControlProps> = ({
  openLongTrade,
  openMarketLongTrade,
  closeLongTrade,
  openShortTrade,
  openMarketShortTrade,
  closeShortTrade,
  closeAllOrders,
  closePosition,
  cancelOrder,
  toggleChase,
  addStopLoss,
  positions,
  tickerInfo,
  wallet,
  ticker,
  orders,
  orderbook,
}) => {
  const [positionSize, setPositionSize] = useState<number>(0.001);

  if (!ticker || !wallet || !tickerInfo || !orderbook) {
    return <></>;
  }

  return (
    <PositionPageComponent>
      <LeftColumnComponent>
        <TradingDom
          orderbook={orderbook}
          addStopLoss={addStopLoss}
          openLong={(p) => {
            openLongTrade(positionSize.toString(), p);
          }}
          openShort={(p) => {
            openShortTrade(positionSize.toString(), p);
          }}
          closeLong={(p) => {
            closeLongTrade(positionSize.toString(), p);
          }}
          closeShort={(p) => {
            closeShortTrade(positionSize.toString(), p);
          }}
        />
      </LeftColumnComponent>
      <PositionPageContent>
        <CardSymbol
          symbolInfo={tickerInfo}
          wallet={wallet}
          price={ticker}
          positionSizeUpdated={(s) => setPositionSize(s)}
          longTrade={() => openMarketLongTrade(positionSize.toString())}
          shortTrade={() => openMarketShortTrade(positionSize.toString())}
          closeAll={closeAllOrders}
        />

        <div className="grid gap-4 ">
          <CardPositions positions={positions} price={ticker} closePosition={closePosition} />
          <CardOrders
            positions={positions}
            orders={orders}
            cancelOrder={cancelOrder}
            toggleChase={toggleChase}
          />
        </div>
        {/* <pre>{JSON.stringify(ticker, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(tickerInfo, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(price, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(wallets, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(orders, null, 2)}</pre> */}

        {/* <pre>{JSON.stringify(executions, null, 2)}</pre>
      <pre>{JSON.stringify(wallet, null, 2)}</pre>*/}
        {/* <pre>{JSON.stringify(positions, null, 2)}</pre>  */}
      </PositionPageContent>
    </PositionPageComponent>
  );
};

const PositionsPage = withTradingControl(PositionsPageComponent);

export default PositionsPage;
