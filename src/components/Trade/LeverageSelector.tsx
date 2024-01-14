import { debounce } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useApi } from '../../providers';
import { selectCurrentPosition, selectLeverage, selectTicker, updateLeverage } from '../../store/slices';
import { SlidePicker } from '../Forms';

export const LeverageSelector: React.FC = () => {
  const dispatch = useDispatch();
  const api = useApi();
  const leverage = useSelector(selectLeverage);
  const currentPosition = useSelector(selectCurrentPosition);
  const tickerInfo = useSelector(selectTicker)?.tickerInfo;

  const max = tickerInfo?.leverageFilter.maxLeverage || '100';
  const min = tickerInfo?.leverageFilter.minLeverage || '1';
  const step = 1;

  const [currentPositionLeverage, setCurrentPositionLeverage] = useState(Number(currentPosition?.leverage) || leverage);

  useEffect(() => {
    if (!currentPosition) {
      setCurrentPositionLeverage(0);
      onValueChanged(1);
    } else {
      const leverage = Number(currentPosition.leverage);
      setCurrentPositionLeverage(leverage);
    }
  }, [currentPosition]);

  const onValueChanged = (v: number) => {
    dispatch(updateLeverage(v));

    if (tickerInfo?.symbol) {
      updateApiLeverage(v, tickerInfo.symbol);
    }
  };

  const updateApiLeverage = useCallback(
    debounce((v, s) => {
      api.setLeverage({
        category: 'linear',
        symbol: s,
        buyLeverage: v.toString(),
        sellLeverage: v.toString(),
      });
    }, 300),
    [],
  );

  const currentLeverage = currentPositionLeverage || leverage;
  return (
    <div className="flex flex-col rounded-md bg-gray-200 p-3">
      <h1>Leverage {currentLeverage}x</h1>
      <SlidePicker value={currentLeverage} min={Number(min)} max={Number(max)} step={Number(step)} onValueChanged={onValueChanged} />
    </div>
  );
};
