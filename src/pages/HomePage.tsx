import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import tw from 'twin.macro';
import { CardPositionControl, CardSymbol, CardWallet } from '../components/Cards';
import CardClosedPnLs from '../components/Cards/CardClosedPnL';
import CardExecutions from '../components/Cards/CardExecutions';
import CardPositions from '../components/Cards/CardPositions';
import { Chart } from '../components/Chart';
import { Tabs } from '../components/Tabs';
import { IntervalSelector } from '../components/Trade/IntervalSelector';
import { SymbolSelector } from '../components/Trade/SymbolSelector';
import withTradingControl, { WithTradingControlProps } from '../hoc/withTradingControl';
import { selectCurrentPosition, selectIsAppStarted, selectIsLoading, selectOrders, selectPositions } from '../store/slices';
import CardOrders from '../components/Cards/CardOrders';
import { initApp } from '../store/actions';
import { AppDispatch } from '../store';
import { useApi } from '../providers';
import { useNavigate, useParams } from 'react-router-dom';

const HomePageComponent: React.FC<WithTradingControlProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const apiClient = useApi();
  const navigate = useNavigate();

  const currentPosition = useSelector(selectCurrentPosition);
  const positions = useSelector(selectPositions);
  const orders = useSelector(selectOrders);
  const isAppStarted = useSelector(selectIsAppStarted);
  const isLoading = useSelector(selectIsLoading);
  const params = useParams();

  useEffect(() => {
    dispatch(initApp(apiClient, navigate, params))
      .then((isLoaded) => {
        if (!isLoaded) {
          navigate('/settings');
        }
      })
      .catch(() => {
        navigate('/settings');
      });
  }, []);
  const isAppLoading = !isAppStarted || isLoading;
  return (
    <ContentWrapper>
      {isAppLoading ? <LoadingContent /> : null}
      <PositionPageContent>
        {!isAppStarted ? (
          <p>Loading</p>
        ) : (
          <>
            <TopComponent>
              <SymbolSelector />
              <IntervalSelector />
              <CardWallet className="ml-auto" />
            </TopComponent>
            <div className="flex flex-col gap-y-3">
              <div className="grid grid-cols-10 gap-x-3 gap-y-3">
                <div className="col-span-10  flex flex-col gap-y-3 md:col-span-7">
                  <div className=" rounded-lg bg-gray-200  p-3">{!isLoading ? <Chart /> : <></>}</div>
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
                      title: `Positions (${positions.length})`,
                      content: <CardPositions />,
                    },
                    {
                      title: `Orders (${orders.length})`,
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
          </>
        )}
      </PositionPageContent>
    </ContentWrapper>
  );
};

const HomePage = withTradingControl(HomePageComponent);

export default HomePage;

const ContentWrapper = tw.div`
flex
flex-col
w-full
grow
`;

const LoadingContent = tw.div`
absolute
left-0
top-0
right-0
bottom-0
bg-black
opacity-80
z-50
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
