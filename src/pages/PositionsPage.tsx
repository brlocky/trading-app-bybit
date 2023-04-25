import React, { useState } from 'react';
import CardPositions from '../components/Cards/CardPositions';
import CardSymbol from '../components/Cards/CardSymbol';
import CardOrders from '../components/Cards/CardOrders';
import withTradingControl, { WithTradingControlProps } from '../hoc/withTradingControl';



const PositionsPageComponent: React.FC<WithTradingControlProps> = ({
  openLongTrade,
  openShortTrade,
  closeAllOrders,
  closeTrade,
  cancelOrder,
  toggleChase,
  positions,
  tickerInfo,
  wallet,
  ticker,
  orders
}) => {
  const [positionSize, setPositionSize] = useState<number>(0.001);

  if (!ticker || !wallet || !tickerInfo) {
    return <></>;
  }

  return (
    <>
      <CardSymbol
        symbolInfo={tickerInfo}
        wallet={wallet}
        price={ticker}
        positionSizeUpdated={(s) => setPositionSize(s)}
        longTrade={() => openLongTrade(positionSize.toString())}
        shortTrade={() => openShortTrade(positionSize.toString())}
        closeAll={closeAllOrders}
      />

      <div className="grid gap-4 ">
        <CardPositions positions={positions} price={ticker} closeTrade={closeTrade} />
        <CardOrders orders={orders} cancelOrder={cancelOrder} toggleChase={toggleChase} />
      </div>
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

const PositionsPage = withTradingControl(PositionsPageComponent);

export default PositionsPage;
