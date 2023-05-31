import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useApi } from '../../providers';
import { selectPositionMode, selectSymbol, updatePositionMode } from '../../slices';
import { ToggleInput } from '../Forms';

export const PositionModeSelector: React.FC = () => {
  const dispatch = useDispatch();
  const apiClient = useApi();
  const symbol = useSelector(selectSymbol);
  const positionMode = useSelector(selectPositionMode);
  const [currentMode, setCurrentMode] = useState<string>('0');

  useEffect(() => {
    setCurrentMode(positionMode.toString());
  }, [positionMode]);

  const updatePositionModeHandler = (v: string) => {
    setCurrentMode(v);
    const typedValue = Number(v);
    if (typedValue === 0 || typedValue === 3) {
      dispatch(updatePositionMode(typedValue));
      updateApiPositionMode(typedValue);
    }
  };
  const positionModeData = [
    { name: 'One-Way Mode', value: '0' },
    { name: 'Hedge Mode', value: '3' },
  ];

  const updateApiPositionMode = (pMode: 0 | 3) => {
    if (!symbol) return;
    apiClient
      .switchPositionMode({
        category: 'linear',
        symbol: symbol,
        mode: pMode,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else {
          toast.success('Position Mode changed');
        }
      });
  };

  return (
    <div className="flex flex-col">
      <h1>PositionMode</h1>

      <span>
        <ToggleInput toggles={positionModeData} defaultToggle={currentMode} onChange={updatePositionModeHandler} />
      </span>
    </div>
  );
};
