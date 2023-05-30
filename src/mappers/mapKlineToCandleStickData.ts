import { UTCTimestamp } from '@felipecsl/lightweight-charts';
import { CandlestickDataWithVolume } from '../types';


// Mapper function to convert ApiResponse to WsResponse
export const mapKlineToCandleStickData = (kline: string[]): CandlestickDataWithVolume => {
  const [time, open, high, low, close, volume] = kline;
  return {
    time: (parseInt(time) / 1000) as UTCTimestamp,
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close),
    volume: parseFloat(volume),
  };
};

interface Props {
  start: number;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
}
export const mapKlineObjToCandleStickData = ({ start, open, close, high, low, volume}: Props): CandlestickDataWithVolume => {
  return {
    time: (start / 1000) as UTCTimestamp,
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close),
    volume: parseFloat(volume),
  };
};
