import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addChartLine, removeChartLine, selectLines } from '../../slices';
import { selectCurrentPosition, selectTicker, selectTickerInfo } from '../../slices/symbolSlice';
import Button from '../Button/Button';
import { formatPriceWithTickerInfo } from '../../utils/tradeUtils';

export const ChartTools: React.FC = () => {
  const currentPosition = useSelector(selectCurrentPosition);
  const tickerInfo = useSelector(selectTickerInfo);
  const ticker = useSelector(selectTicker);
  const lines = useSelector(selectLines);

  const dispatch = useDispatch();

  if (!tickerInfo) return <></>;

  const calculateTPPrice = () => {
    const fromPrice = Number(ticker?.lastPrice);
    const tpPercentage = 1;
    const diff = (fromPrice * tpPercentage) / 100;
    const side = currentPosition ? currentPosition.side : 'Buy';
    return formatPriceWithTickerInfo(side === 'Buy' ? fromPrice + diff : fromPrice - diff, tickerInfo);
  };

  const calculateSLPrice = () => {
    const fromPrice = Number(ticker?.lastPrice);
    const tpPercentage = 1;
    const diff = (fromPrice * tpPercentage) / 100;
    const side = currentPosition ? currentPosition.side : 'Buy';
    return formatPriceWithTickerInfo(side === 'Buy' ? fromPrice - diff : fromPrice + diff, tickerInfo);
  };

  const addTP = () => {
    const index = lines.findIndex((o) => o.type === 'TP');
    /* if (index !== -1) {
      dispatch(removeChartLine({ index: index }));
    } else {
      dispatch(addChartLine({ type: 'TP', price: calculateTPPrice(), draggable: true, qty: 0 }));
    } */
  };

  const addSL = () => {
    const index = lines.findIndex((o) => o.type === 'SL');
    /* if (index !== -1) {
      dispatch(removeChartLine({ index: index }));
    } else {
      dispatch(addChartLine({ type: 'SL', price: calculateSLPrice(), draggable: true, qty: 0 }));
    } */
  };

  const hasTP = lines.findIndex((o) => o.type === 'TP') !== -1;
  const hasSL = lines.findIndex((o) => o.type === 'SL') !== -1;

  return (
    <div className="absolute left-2 top-2 z-10 flex gap-x-2 rounded-lg bg-gray-700 p-2">
      <Button onClick={addTP} className="bg-green-200">
        {hasTP ? '- TP' : '+ TP'}
      </Button>
      <Button onClick={addSL} className="bg-red-400">
        {hasSL ? '- SL' : '+ SL'}
      </Button>
    </div>
  );
};
