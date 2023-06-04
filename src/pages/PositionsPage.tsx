import React from 'react';
import tw from 'twin.macro';
import CardClosedPnLs from '../components/Cards/CardClosedPnL';
import CardExecutions from '../components/Cards/CardExecutions';
import CardPositions from '../components/Cards/CardPositions';
import { Chart } from '../components/Chart';
import { IntervalSelector } from '../components/Trade/IntervalSelector';
import { SymbolSelector } from '../components/Trade/SymbolSelector';
import withTradingControl, { WithTradingControlProps } from '../hoc/withTradingControl';
import CardOrders from '../components/Cards/CardOrders';
import { Tabs } from '../components/Tabs';
import { CardSymbol, CardWallet } from '../components/Cards';

const ContentWrapper = tw.div`
flex
flex-col
w-full
grow
`;

const TopComponent = tw.div`
flex
w-full
`;

const PositionPageContent = tw.div`
flex
flex-col
w-full
p-2
`;

const PositionsPageComponent: React.FC<WithTradingControlProps> = ({ isLoading, tradingService, dataService }) => {
  return (
    <ContentWrapper>
      <PositionPageContent>
        <TopComponent>
          <SymbolSelector />
          <IntervalSelector />
          <CardWallet className="ml-auto" />
        </TopComponent>
        {isLoading ? (
          <p>Loading</p>
        ) : (
          <div className="flex gap-y-3 flex-col">
            <div className="grid grid-cols-10 gap-x-3 ">
              <div className="col-span-7 rounded-lg bg-gray-200 p-3">
                <Chart dataService={dataService} tradingService={tradingService} />
              </div>
              <div className="col-span-3">
                <CardSymbol />
              </div>
            </div>
            <div className="rounded-lg bg-gray-200 p-3">
              <Tabs
                tabs={[
                  {
                    title: 'Positions',
                    content: <CardPositions />,
                  },
                  {
                    title: 'Orders',
                    content: <CardOrders />,
                  },
                  {
                    title: 'Executions',
                    content: <CardExecutions />,
                  },
                  {
                    title: 'PnLs',
                    content: <CardClosedPnLs />,
                  },
                ]}
              />
            </div>
          </div>
        )}
      </PositionPageContent>
    </ContentWrapper>
  );
};

const PositionsPage = withTradingControl(PositionsPageComponent);

export default PositionsPage;
