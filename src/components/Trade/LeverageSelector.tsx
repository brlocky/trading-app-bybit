import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentPosition, selectLeverage, selectSymbol, selectTickerInfo, updateLeverage } from '../../slices';
import SlidePicker from '../Forms/SlidePicker';
import { useApi } from '../../providers';
import { toast } from 'react-toastify';
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

  const onLeverageChanged = useCallback(
    debounce((value: number) => {
      updateApiLeverage(value);
    }, 100),
    [],
  );

  const setLeverage = (v: number) => {
    dispatch(updateLeverage(v));
    onLeverageChanged(v);
  };

  useEffect(() => {
    if (currentPosition) {
      dispatch(updateLeverage(Number(currentPosition.leverage)));
    } else {
      if (leverage > 1) {
        setLeverage(1);
      }
    }
  }, [tickerInfo]);

  const updateApiLeverage = (v: number) => {
    if (!symbol) return;

    console.log({
      category: 'linear',
      symbol: symbol,
      buyLeverage: v.toString(),
      sellLeverage: v.toString(),
    });

    api
      .setLeverage({
        category: 'linear',
        symbol: symbol,
        buyLeverage: v.toString(),
        sellLeverage: v.toString(),
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        }
      });
  };

  return (
    <div className="flex flex-col">
      <h1>Leverage {leverage}x</h1>
      <SlidePicker value={leverage} min={Number(min)} max={Number(max)} step={Number(step)} onValueChanged={setLeverage} />
    </div>
  );
};
