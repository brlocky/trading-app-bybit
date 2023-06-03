import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import tw from 'twin.macro';
import { selectLeverage, selectSymbol, selectTickerInfo, updateLeverage } from '../../slices';
import SlidePicker from '../Forms/SlidePicker';
import { useApi } from '../../providers';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

const Row = tw.div`inline-flex w-full justify-between pb-3`;
const Col = tw.div`flex flex-col md:flex-row items-center gap-x-5`;

export const LeverageSelector: React.FC = () => {
  const dispatch = useDispatch();
  const api = useApi();
  const symbol = useSelector(selectSymbol);
  const leverage = useSelector(selectLeverage);
  const tickerInfo = useSelector(selectTickerInfo);
  const [currentLeverage, setCurrentLeverage] = useState<number>(leverage);

  const max = tickerInfo?.leverageFilter.maxLeverage || '100';
  const min = tickerInfo?.leverageFilter.minLeverage || '1';
  const step = 1;

  const onLeverageChanged = useCallback(
    debounce((value: number) => {
      updateApiLeverage(value);
    }, 100),
    [],
  );

  useEffect(() => {
    if (tickerInfo && leverage > 1) {
      onLeverageChange(1);
    }
  }, [tickerInfo]);

  const onLeverageChange = (v: number) => {
    setCurrentLeverage(v);
    dispatch(updateLeverage(v));
    onLeverageChanged(v);
  };

  const updateApiLeverage = (v: number) => {
    if (!symbol) return;
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
      <SlidePicker value={leverage} min={Number(min)} max={Number(max)} step={Number(step)} onValueChanged={onLeverageChange} />
    </div>
  );
};
