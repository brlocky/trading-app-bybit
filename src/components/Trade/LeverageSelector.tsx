import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useApi } from '../../providers';
import { selectCurrentPosition, selectLeverage, selectSymbol, selectTickerInfo, updateLeverage } from '../../slices';
import SlidePicker from '../Forms/SlidePicker';
import { debounce } from 'lodash';

export const LeverageSelector: React.FC = () => {
  const dispatch = useDispatch();
  const api = useApi();
  const symbol = useSelector(selectSymbol);
  const leverage = useSelector(selectLeverage);
  const tickerInfo = useSelector(selectTickerInfo);
  const currentPosition = useSelector(selectCurrentPosition);

  const max = tickerInfo?.leverageFilter.maxLeverage || '100';
  const min = tickerInfo?.leverageFilter.minLeverage || '1';
  const step = 1;

  useEffect(() => {
    dispatch(updateLeverage(1));
  }, []);

  useEffect(() => {
    if (currentPosition) {
      dispatch(updateLeverage(Number(currentPosition.leverage)));
    } else {
      dispatch(updateLeverage(1));
    }
  }, [currentPosition]);

  const onValueChanged = (v: number) => {
    dispatch(updateLeverage(v));

    if (currentPosition && tickerInfo?.symbol) {
      updateApiLeverage(v, tickerInfo.symbol);
    }
  };

  const updateApiLeverage = useCallback(
    debounce((v, s) => {
      if (!symbol) return;

      api
        .setLeverage({
          category: 'linear',
          symbol: s,
          buyLeverage: v.toString(),
          sellLeverage: v.toString(),
        })
        .then((r) => {
          if (r.retCode !== 0) {
            toast.error(r.retMsg);
          }
        });
    }, 300),
    [],
  );

  return (
    <div className="flex flex-col rounded-md bg-gray-200 p-3">
      <h1>Leverage {leverage}x</h1>
      <SlidePicker value={leverage} min={Number(min)} max={Number(max)} step={Number(step)} onValueChanged={onValueChanged} />
    </div>
  );
};
