import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectInterval } from '../../store/slices/uiSlice';

export const ChartTimer: React.FC = () => {
  const selectedInterval = useSelector(selectInterval);

  const intervals: Record<string, number> = {
    '1': 60,
    '3': 180,
    '5': 300,
    '15': 900,
    '60': 3600,
    '240': 14400,
  };

  // Function to format time as hh:mm:ss
  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const remainingTime = timeInSeconds % 3600;
    const minutes = Math.floor(remainingTime / 60);
    const seconds = Math.floor(remainingTime % 60);

    if (selectedInterval === '240')
      return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Define the selected interval duration in seconds
  const intervalDuration = intervals[selectedInterval];

  // Calculate the current time in seconds since the epoch
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  // Use a ticker with a 1-second interval
  const tickerInterval = 1000;

  // Function to update the current time
  const updateCurrentTime = () => {
    setCurrentTime(Math.floor(Date.now() / 1000));
  };

  // Use useEffect to start the timer and continuously update the time
  useEffect(() => {
    // Check if the selected interval is 'D', 'W', or 'M'
    if (selectedInterval !== 'D' && selectedInterval !== 'W' && selectedInterval !== 'M') {
      const intervalId = setInterval(updateCurrentTime, tickerInterval);

      // Clean up the interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, [selectedInterval]);

  // Calculate the time remaining until the next interval boundary
  const timeRemaining = intervalDuration - (currentTime % intervalDuration) - 1;

  // Protect against displaying 'D', 'W', and 'M' intervals
  if (selectedInterval === 'D' || selectedInterval === 'W' || selectedInterval === 'M') {
    return <></>;
  }

  return <div className="absolute right-20 top-2 z-10 flex gap-x-2 rounded-lg bg-blue-100 p-2 font-bold">{formatTime(timeRemaining)}</div>;
};
