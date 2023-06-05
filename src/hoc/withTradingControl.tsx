import { LinearInverseInstrumentInfoV5 } from 'bybit-api';
import React, { ComponentType, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useApi } from '../providers';
import { selectSymbol, updateExecutions, updateOrders, updatePositions, updateTickerInfo, updateWallet } from '../slices/symbolSlice';
import { AppDispatch } from '../store';

const accountType = 'CONTRACT';

export interface WithTradingControlProps {
  isLoading: boolean;
}

function withTradingControl<P extends WithTradingControlProps>(
  WrappedComponent: ComponentType<P>,
): React.FC<Omit<P, keyof WithTradingControlProps>> {
  const WithTradingControl: React.FC<Omit<P, keyof WithTradingControlProps>> = (props) => {
    const [isLoading, setIsLoading] = useState(true);
    const symbol = useSelector(selectSymbol);

    const apiClient = useApi(); // Use the useApi hook to access the API context
    const dispatch = useDispatch<AppDispatch>();
    useEffect(() => {
      const activeOrdersPromise = apiClient.getActiveOrders({
        category: 'linear',
        settleCoin: 'USDT',
      });

      const positionInfoPromise = apiClient.getPositionInfo({
        category: 'linear',
        settleCoin: 'USDT',
      });

      const excutionListPromise = apiClient.getExecutionList({
        category: 'linear',
      });

      const walletInfoPromise = apiClient.getWalletBalance({
        accountType: accountType,
        coin: 'USDT',
      });

      Promise.all([activeOrdersPromise, positionInfoPromise, walletInfoPromise, excutionListPromise]).then(
        ([orderInfo, positionInfo, walletInfo, excutionList]) => {
          orderInfo.retCode === 0 ? dispatch(updateOrders(orderInfo.result.list)) : toast.error('Error loading orders');
          excutionList.retCode === 0
            ? dispatch(updateExecutions(excutionList.result.list.sort((a, b) => Number(b.execTime) - Number(a.execTime))))
            : toast.error('Error loading executions');
          positionInfo.retCode === 0 ? dispatch(updatePositions(positionInfo.result.list)) : toast.error('Error loading positions');

          const usdtWallet = walletInfo.result.list[0];
          if (usdtWallet) {
            dispatch(updateWallet(usdtWallet));
          }

          setIsLoading(false);
        },
      );
    }, []);

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

    return <WrappedComponent {...(props as P)} isLoading={isLoading} />;
  };

  return WithTradingControl;
}

export default withTradingControl;
