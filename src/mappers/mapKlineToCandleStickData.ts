import { CandlestickData, UTCTimestamp } from 'lightweight-charts';

// Mapper function to convert ApiResponse to WsResponse
export const mapKlineToCandleStickData = (kline: string[]): CandlestickData => {
  const [time, open, high, low, close] = kline;

  return {
    time: (parseInt(time) / 1000) as UTCTimestamp,
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close),
  };
};

interface Props {
  start: number;
  open: string;
  close: string;
  high: string;
  low: string;
}
export const mapKlineObjToCandleStickData = ({
  start,
  open,
  close,
  high,
  low,
}: Props): CandlestickData => {
  return {
    time: (start / 1000) as UTCTimestamp,
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close),
  };
};
