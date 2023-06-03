import { LinearInverseInstrumentInfoV5 } from 'bybit-api';
import React, { ComponentType, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useApi } from '../providers';
import { DataService, IDataService, ITradingService, TradingService } from '../services';
import {
  selectSymbol,
  selectTickerInfo,
  updateExecutions,
  updateOrders,
  updatePositions,
  updateTickerInfo,
  updateWallet,
} from '../slices/symbolSlice';
import { AppDispatch } from '../store';

const accountType = 'CONTRACT';

export interface WithTradingControlProps {
  tradingService: ITradingService;
  dataService: IDataService;
}

function withTradingControl<P extends WithTradingControlProps>(
  WrappedComponent: ComponentType<P>,
): React.FC<Omit<P, keyof WithTradingControlProps>> {
  const WithTradingControl: React.FC<Omit<P, keyof WithTradingControlProps>> = (props) => {
    const symbol = useSelector(selectSymbol);
    const tickerInfo = useSelector(selectTickerInfo);

    const dispatch = useDispatch<AppDispatch>();

    const apiClient = useApi(); // Use the useApi hook to access the API context

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

    useEffect(() => {
      reloadTradingInfo();
    }, [tickerInfo]);

    const reloadTradingInfo = () => {
      if (!symbol) return;

      const activeOrdersPromise = apiClient.getActiveOrders({
        category: 'linear',
        symbol: symbol,
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
          excutionList.retCode === 0 ? dispatch(updateExecutions(excutionList.result.list)) : toast.error('Error loading executions');
          positionInfo.retCode === 0 ? dispatch(updatePositions(positionInfo.result.list)) : toast.error('Error loading positions');

          const usdtWallet = walletInfo.result.list[0];
          if (usdtWallet) {
            dispatch(updateWallet(usdtWallet));
          }
        },
      );
    };

    const tradingService = TradingService(apiClient);
    const dataService = DataService(apiClient);

    return <WrappedComponent {...(props as P)} tradingService={tradingService} dataService={dataService} />;
  };

  return WithTradingControl;
}

export default withTradingControl;
