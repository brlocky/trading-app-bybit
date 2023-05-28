import { KlineIntervalV3, RestClientV5 } from 'bybit-api';
import { CandlestickData } from 'lightweight-charts';
import { mapKlineToCandleStickData } from '../mappers';

interface IKlineProps {
  symbol: string;
  category: 'spot' | 'linear' | 'inverse';
  interval: KlineIntervalV3;
}
export interface IDataService {
  getKline: (props: IKlineProps) => Promise<CandlestickData[]>;
}

export const DataService = (apiClient: RestClientV5): IDataService => {
  const getKline = async ({ symbol, category = 'linear', interval }: IKlineProps) => {
    let intervalMinutes = 0;
    let loop = 0;

    switch (interval) {
      case '60':
      case '120':
      case '240':
      case '360':
      case '720':
        intervalMinutes = 200 * 60 * (parseInt(interval) / 60);
        loop = 360;
        break;

      case 'D':
        intervalMinutes = 200 * 60 * 24;
        loop = 720;
        break;

      case 'W':
        intervalMinutes = 200 * 60 * 24 * 7;
        loop = 1440;
        break;

      case 'M':
        intervalMinutes = 200 * 60 * 24 * 31;
        loop = 1440;
        break;

      default:
        intervalMinutes = 200 * parseInt(interval);
        loop = 3;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - loop);

    let startTime = startDate.getTime();
    const promises = [];

    while (startTime <= Date.now()) {
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + intervalMinutes);

      const promise = apiClient.getKline({
        category,
        symbol,
        interval,
        start: Math.floor(startTime),
        end: Math.floor(endTime.getTime()),
      });

      promises.push(promise);
      startTime = endTime.getTime();
    }

    const allResults = await Promise.all(promises);
    const data = allResults.map((r) => r.result.list).flat();

    const processedData = data.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));

    return processedData;
  };

  return {
    getKline,
  };
};
