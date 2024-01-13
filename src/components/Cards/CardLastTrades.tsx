import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectLastTrades, selectSymbol, updateLastTrades } from '../../store/slices';
import { useApi } from '../../providers';
import { PublicTradeV5 } from 'bybit-api';

export const CardLastTrades: React.FC = () => {
  const symbol = useSelector(selectSymbol);
  const lastTrades = useSelector(selectLastTrades);
  const apiClient = useApi();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!symbol) return;
    console.log('Load last trades');
    apiClient
      .getPublicTradingHistory({
        category: 'linear',
        symbol: symbol,
      })
      .then((r) => {
        dispatch(updateLastTrades(r.result.list));
      });
  }, []);

  const calculateAverageSize = (trades: PublicTradeV5[]) => {
    const totalSize = trades.reduce((acc, trade) => acc + parseFloat(trade.size), 0);
    return totalSize / trades.length;
  };

  const getColorBasedOnTrade = (trade: PublicTradeV5, averageSize: number) => {
    let colorClass = '';
    const size = parseFloat(trade.size);
    const isBuy = trade.side === 'Buy';

    if (isBuy) {
      if (size <= averageSize / 2) {
        colorClass = 'bg-green-50';
      } else if (size <= averageSize) {
        colorClass = 'bg-green-100';
      } else if (size >= averageSize * 2) {
        colorClass = 'bg-green-400';
      } else if (size >= averageSize) {
        colorClass = 'bg-green-300';
      }
    } else {
      if (size <= averageSize / 2) {
        colorClass = 'bg-red-50';
      } else if (size <= averageSize) {
        colorClass = 'bg-red-100';
      } else if (size >= averageSize * 2) {
        colorClass = 'bg-red-400';
      } else if (size >= averageSize) {
        colorClass = 'bg-red-300';
      }
    }

    const time = new Date(parseInt(trade.time, 10)).toTimeString().split(' ')[0];

    return {
      colorClass,
      time,
    };
  };

  const averageSize = calculateAverageSize(lastTrades);
  return (
    <div className="justify-top flex flex-col rounded-lg bg-gray-200">
      <div className="border-b border-gray-200 p-1">
        <div className="grid grid-cols-3 gap-1 text-center text-sm">
          <div className="col-span-1">Price</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-1">Time</div>
        </div>
      </div>
      <div className="h-52 overflow-y-scroll">
        {lastTrades.slice(0, 20).map((trade, index) => {
          const { colorClass, time } = getColorBasedOnTrade(trade, averageSize);
          const formattedSize = parseFloat(trade.size).toLocaleString();

          return (
            <div className={`border-b border-gray-200 p-1 ${colorClass}`} key={index}>
              <div className="grid grid-cols-3 gap-1 text-center text-xs">
                <div className="col-span-1">{trade.price}</div>
                <div className="col-span-1">{formattedSize}</div>
                <div className="col-span-1">{time}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-b border-gray-200 p-2" />
    </div>
  );
};
