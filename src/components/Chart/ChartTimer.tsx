import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectInterval } from '../../slices/symbolSlice';

export const ChartTimer: React.FC = () => {
  const selectedInterval = useSelector(selectInterval);

  console.log('interval', selectedInterval);

  const intervals: Record<string, number> = {
    '1': 60,
    '3': 180,
    '5': 300,
    '15': 900,
    '60': 3600,
    '240': 14400,
    D: 86400,
    W: 604800,
    M: 2419200,
  };

  // Define the selected interval (for example, '1m' for 1 minute)

  const [countDown, setCountDown] = useState(intervals[selectedInterval]);

  // Use a ticker with a 100ms interval
  const tickerInterval = 100;
  const [ticker, setTicker] = useState(0);

  // Use useEffect to start the ticker
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTicker((prevTicker) => prevTicker + tickerInterval);
    }, tickerInterval);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Use useEffect to update the countdown based on the ticker
  useEffect(() => {
    const intervalDuration = intervals[selectedInterval];
    const elapsedSeconds = ticker / 1000;

    if (elapsedSeconds < intervalDuration) {
      const remainingSeconds = intervalDuration - elapsedSeconds;
      setCountDown(remainingSeconds);
    } else {
      setCountDown(0); // The interval has expired
    }
  }, [ticker, selectedInterval]);

  // Convert timeDifference to minutes and seconds
  const minutes = Math.floor(countDown / 60);
  const seconds = Math.floor(countDown % 60);

  return (
    <div className="absolute right-20 top-2 z-10 flex gap-x-2 rounded-lg bg-gray-200 p-2">
      Time left: {minutes} minutes {seconds} seconds
    </div>
  );
};
