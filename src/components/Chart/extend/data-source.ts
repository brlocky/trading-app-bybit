import {
	IChartApi,
	ISeriesApi,
	SeriesOptionsMap,
	Time,
} from 'lightweight-charts';
import { TradingLinesOptions } from './options';

export interface Point {
	time: Time;
	price: number;
}

export interface TradingLinesDataSource {
	chart: IChartApi;
	series: ISeriesApi<keyof SeriesOptionsMap>;
	options: TradingLinesOptions;
	p1: Point;
	p2: Point;
}
