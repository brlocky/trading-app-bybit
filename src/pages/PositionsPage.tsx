import { LinearInverseInstrumentInfoV5 } from 'bybit-api';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import tw from 'twin.macro';
import CardOrders from '../components/Cards/CardOrders';
import CardPositions from '../components/Cards/CardPositions';
import CardSymbol from '../components/Cards/CardSymbol';
import { Chart } from '../components/Chart';
import { IntervalSelector } from '../components/Trade/IntervalSelector';
import { SymbolSelector } from '../components/Trade/SymbolSelector';
import withTradingControl, { WithTradingControlProps } from '../hoc/withTradingControl';
import { useApi } from '../providers';
import { selectPositionSize } from '../slices';
import { selectOrders, selectPositions, selectSymbol, updateTickerInfo } from '../slices/symbolSlice';
import { AppDispatch } from '../store';

const ContentWrapper = tw.div`
flex
flex-col
w-full
grow
`;

const TopComponent = tw.div`
flex
p-2
gap-x-2
`;

const PositionPageContent = tw.div`
flex
flex-col
w-full
p-2
`;

const PositionsPageComponent: React.FC<WithTradingControlProps> = ({
  tradingService,
  dataService,
  openMarketLongTrade,
  openMarketShortTrade,
  closeAllOrders,
  cancelOrder,
}) => {
  const symbol = useSelector(selectSymbol);
  const orders = useSelector(selectOrders);
  const positions = useSelector(selectPositions);
  const positionSize = useSelector(selectPositionSize);

  const dispatch = useDispatch<AppDispatch>();
  const apiClient = useApi();

  useEffect(() => {
    if (symbol) {
      apiClient
        .getInstrumentsInfo({
          category: 'linear',
          symbol: symbol,
        })
        .then((res) => {
          dispatch(updateTickerInfo(res.result.list[0] as LinearInverseInstrumentInfoV5));
        });
    }
  }, [symbol]);

  return (
    <ContentWrapper>
      <PositionPageContent>
        <TopComponent>
          <SymbolSelector />
          <IntervalSelector />
        </TopComponent>

        <div className="grid grid-cols-10 gap-x-2">
          <div className="col-span-7">
            <Chart dataService={dataService} tradingService={tradingService} />
          </div>
          <div className="col-span-3">
            <CardSymbol
              tradingService={tradingService}
              longTrade={() => openMarketLongTrade(positionSize.toString())}
              shortTrade={() => openMarketShortTrade(positionSize.toString())}
              closeAll={closeAllOrders}
            />
          </div>
        </div>

        <div className="grid gap-4 ">
          <CardPositions tradingService={tradingService} />
          {/* <CardOrders positions={positions} orders={orders} cancelOrder={cancelOrder} /> */}
        </div>
      </PositionPageContent>
    </ContentWrapper>
  );
};

const PositionsPage = withTradingControl(PositionsPageComponent);

export default PositionsPage;
