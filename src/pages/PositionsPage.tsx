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
import { CardPositionControl, CardSymbol, CardWallet } from '../components/Cards';
import { useSelector } from 'react-redux';
import { selectCurrentPosition } from '../slices';

const ContentWrapper = tw.div`
flex
flex-col
w-full
grow
`;

const TopComponent = tw.div`
flex
w-full
gap-x-2
items-center
`;

const PositionPageContent = tw.div`
flex
flex-col
w-full
p-2
overflow-hidden
`;

const PositionsPageComponent: React.FC<WithTradingControlProps> = ({ isLoading }) => {
  const currentPosition = useSelector(selectCurrentPosition);
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
          <div className="flex flex-col gap-y-3">
            <div className="grid grid-cols-10 gap-x-3 gap-y-3">
              <div className="col-span-10  flex flex-col gap-y-3 md:col-span-7">
                <div className=" rounded-lg bg-gray-200  p-3">
                  <Chart />
                </div>
                {currentPosition ? (
                  <div className=" rounded-lg bg-gray-200  p-3">
                    <CardPositionControl />
                  </div>
                ) : null}
              </div>
              <div className="col-span-10 md:col-span-3">
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
