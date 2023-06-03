import React from 'react';
import tw from 'twin.macro';
import CardClosedPnLs from '../components/Cards/CardClosedPnL';
import CardExecutions from '../components/Cards/CardExecutions';
import CardPositions from '../components/Cards/CardPositions';
import CardSymbol from '../components/Cards/CardSymbol';
import { Chart } from '../components/Chart';
import { IntervalSelector } from '../components/Trade/IntervalSelector';
import { SymbolSelector } from '../components/Trade/SymbolSelector';
import withTradingControl, { WithTradingControlProps } from '../hoc/withTradingControl';
import CardOrders from '../components/Cards/CardOrders';
import { Tabs } from '../components/Tabs';

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

const PositionsPageComponent: React.FC<WithTradingControlProps> = ({ isLoading, tradingService, dataService }) => {
  return (
    <ContentWrapper>
      <PositionPageContent>
        <TopComponent>
          <SymbolSelector />
          <IntervalSelector />
        </TopComponent>
        {isLoading ? (
          <p>Loading</p>
        ) : (
          <>
            <div className="grid grid-cols-10 gap-x-10 pb-10">
              <div className="col-span-7">
                <Chart dataService={dataService} tradingService={tradingService} />
              </div>
              <div className="col-span-3">
                <CardSymbol tradingService={tradingService} />
              </div>
            </div>

            <div >
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
          </>
        )}
      </PositionPageContent>
    </ContentWrapper>
  );
};

const PositionsPage = withTradingControl(PositionsPageComponent);

export default PositionsPage;
