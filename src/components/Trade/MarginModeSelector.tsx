import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useApi } from '../../providers';
import { selectLeverage, selectMarginMode, selectSymbol, updateMarginMode } from '../../slices';
import { ToggleInput } from '../Forms';

export const MarginModeSelector: React.FC = () => {
  const dispatch = useDispatch();
  const apiClient = useApi();
  const symbol = useSelector(selectSymbol);
  const leverage = useSelector(selectLeverage);
  const marginMode = useSelector(selectMarginMode);
  const [currentMode, setCurrentMode] = useState<string>('0');

  useEffect(() => {
    setCurrentMode(marginMode.toString());
  }, [marginMode]);

  const updateMarginModeHandler = (v: string) => {
    setCurrentMode(v);
    const typedValue = Number(v);
    if (typedValue === 0 || typedValue === 1) {
      dispatch(updateMarginMode(typedValue));
      updateApiMarginMode(typedValue);
    }
  };
  const marginModeData = [
    { name: 'Cross', value: '0' },
    { name: 'Isolated', value: '1' },
  ];

  const updateApiMarginMode = (tMode: 0 | 1) => {
    if (!symbol) return;
    apiClient
      .switchIsolatedMargin({
        category: 'linear',
        symbol: symbol,
        tradeMode: tMode,
        buyLeverage: leverage.toString(),
        sellLeverage: leverage.toString(),
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else {
          toast.success('Margin Mode changed');
        }
      });
  };

  return (
    <div className="flex flex-col">
      <ToggleInput toggles={marginModeData} defaultToggle={currentMode} onChange={updateMarginModeHandler} />
    </div>
  );
};
