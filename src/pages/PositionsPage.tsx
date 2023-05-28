import React, { useEffect, useState } from 'react';
import CardPositions from '../components/Cards/CardPositions';
import CardSymbol from '../components/Cards/CardSymbol';
import CardOrders from '../components/Cards/CardOrders';
import withTradingControl, { WithTradingControlProps } from '../hoc/withTradingControl';
import { TradingDom } from '../components/TradingDom';
import tw from 'twin.macro';
import { Chart } from '../components/Chart';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectInterval,
  selectOrderbook,
  selectOrders,
  selectPositions,
  selectSymbol,
  selectTicker,
  selectTickerInfo,
  selectWallet,
  updateKline,
} from '../slices/symbolSlice';
import { KlineIntervalV3 } from 'bybit-api';
import { AppDispatch } from '../store';
import { SymbolSelector } from '../components/SymbolSelector';
import { IntervalSelector } from '../components/IntervalSelector';

const ContentWrapper= tw.div`
flex
flex-col
w-full
grow
`;
const PositionPageComponent = tw.div`
w-full
grid 
grid-cols-3
grid-rows-2
lg:grid-rows-1
`;

const TopComponent = tw.div`
flex
p-2
gap-x-2
`;

const LeftColumnComponent = tw.div`
flex
p-2
col-span-3
lg:col-span-1
`;

const PositionPageContent = tw.div`
flex
flex-col
w-full
p-2
col-span-3
lg:col-span-2
`;

const PositionsPageComponent: React.FC<WithTradingControlProps> = ({
  tradingService,
  dataService,
  openLongTrade,
  openMarketLongTrade,
  closeLongTrade,
  openShortTrade,
  openMarketShortTrade,
  closeShortTrade,
  closeAllOrders,
  cancelOrder,
  toggleChase,
}) => {
  const [positionSize, setPositionSize] = useState<number>(0.001);

  const symbol = useSelector(selectSymbol);
  const interval = useSelector(selectInterval);
  const orders = useSelector(selectOrders);
  const positions = useSelector(selectPositions);
  const ticker = useSelector(selectTicker);
  const tickerInfo = useSelector(selectTickerInfo);
  const wallet = useSelector(selectWallet);
  const orderbook = useSelector(selectOrderbook);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (symbol) {
      dataService
        .getKline({
          symbol: symbol,
          interval: interval as KlineIntervalV3,
          category: 'linear',
        })
        .then((r) => {
          dispatch(updateKline(r));
        });
    }
  }, [symbol, interval]);

  if (!tickerInfo) {
    return <></>;
  }

  return (
    <ContentWrapper>
      <TopComponent>
        <SymbolSelector />
        <IntervalSelector />
      </TopComponent>
      <PositionPageComponent>
        {/* <CardSymbol
        tradingService={tradingService}
        symbolInfo={tickerInfo}
        wallet={wallet}
        price={ticker}
        positionSizeUpdated={(s) => setPositionSize(s)}
        longTrade={() => openMarketLongTrade(positionSize.toString())}
        shortTrade={() => openMarketShortTrade(positionSize.toString())}
        closeAll={closeAllOrders}
      /> */}

        <LeftColumnComponent>
          <TradingDom
            tradingService={tradingService}
            orderbook={orderbook}
            // addStopLoss={addStopLoss}
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
          <Chart />
          <div className="grid gap-4 ">
            <CardPositions tradingService={tradingService} positions={positions} tickerInfo={ticker} />
            <CardOrders positions={positions} orders={orders} cancelOrder={cancelOrder} toggleChase={toggleChase} />
          </div>
        </PositionPageContent>
      </PositionPageComponent>
    </ContentWrapper>
  );
};

const PositionsPage = withTradingControl(PositionsPageComponent);

export default PositionsPage;
