import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useApi } from '../../providers';
import { IClosePosition, IPositionSide, TradingService } from '../../services';
import { AppDispatch } from '../../store';
import { loadSymbol } from '../../store/actions';
import { selectInterval, selectOrders, selectPositions, selectTicker, selectTickers } from '../../store/slices';
import { calculatePositionPnL, formatCurrency, formatCurrencyValue } from '../../utils/tradeUtils';
import Button from '../Button/Button';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardPositions() {
  const apiClient = useApi();
  const tickers = useSelector(selectTickers);
  const tickerInfo = useSelector(selectTicker)?.tickerInfo;
  const positions = useSelector(selectPositions);
  const orders = useSelector(selectOrders);
  const interval = useSelector(selectInterval);
  const { closePosition } = TradingService(useApi());
  const dispatch = useDispatch<AppDispatch>();

  const closePositionHandler = (p: IClosePosition) => {
    closePosition(p);
  };

  const renderPositions = () => {
    const sortedPositions = [...positions].sort((a, b) => {
      if (b.symbol === tickerInfo?.symbol) return 1;
      if (a.symbol === tickerInfo?.symbol) return -1;
      return 0;
    });

    return sortedPositions.map((p, index) => {
      const symbolOrders = orders.filter((o) => o.symbol === p.symbol);
      const tps = symbolOrders.filter(
        (o) => (p.side === 'Buy' && o.triggerDirection === 1) || (p.side === 'Sell' && o.triggerDirection === 2),
      );
      const sls = symbolOrders.filter(
        (o) => (p.side === 'Buy' && o.triggerDirection === 2) || (p.side === 'Sell' && o.triggerDirection === 1),
      );

      const totalTP = tps.reduce((sum, tp) => sum + Number(tp.qty), 0);
      const totalSL = sls.reduce((sum, sl) => sum + Number(sl.qty), 0);
      const isTPError = tps.length && totalTP !== Number(p.size) ? true : false;
      const isSLError = sls.length && totalSL !== Number(p.size) ? true : false;

      const currentTicker = tickers[p.symbol]?.ticker;
      const currentTickerInfo = tickers[p.symbol]?.tickerInfo;
      const pnl = currentTicker ? Number(calculatePositionPnL(p, currentTicker)) : 0;
      const time = new Date(parseInt(p.createdTime, 10)).toTimeString().split(' ')[0];
      return (
        <Row key={index}>
          <Col onClick={() => dispatch(loadSymbol(apiClient, p.symbol))}>
            <Link to={`/${p.symbol}/${interval}`}>
              <i className={p.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {p.symbol} (
              {p.leverage}x)
            </Link>
          </Col>
          <Col>{formatCurrency(p.avgPrice, currentTickerInfo?.priceScale || '0')}</Col>
          <Col>{p.size}</Col>
          <Col>{formatCurrencyValue(p.positionValue)}</Col>
          <Col>
            {isTPError ? <span className="text-red-600">{tps.length}</span> : <span className="text-green-600">{tps.length}</span>}
            {' / '}
            {isSLError ? <span className="text-red-600">{sls.length}</span> : <span className="text-green-600">{sls.length}</span>}
          </Col>
          <Col>
            {Number(pnl) >= 0 ? (
              <span className="text-green-600">{formatCurrencyValue(pnl)}</span>
            ) : (
              <span className="text-red-600">{formatCurrencyValue(pnl)}</span>
            )}
          </Col>
          <Col>{time}</Col>
          <Col>
            <Button
              onClick={() => {
                closePositionHandler({
                  symbol: p.symbol,
                  qty: p.size,
                  side: p.side as IPositionSide,
                });
              }}
            >
              <i className={'fas fa-close'}></i>
            </Button>
          </Col>
        </Row>
      );
    });
  };

  return (
    <>
      <Table>
        <HeaderRow>
          <HeaderCol>Ticker</HeaderCol>
          <HeaderCol>Entry</HeaderCol>
          <HeaderCol>Size</HeaderCol>
          <HeaderCol>Value</HeaderCol>
          <HeaderCol>TP / SL</HeaderCol>
          <HeaderCol>PnL</HeaderCol>
          <HeaderCol>Date</HeaderCol>
          <HeaderCol>Close</HeaderCol>
        </HeaderRow>
        <tbody>
          {positions.length ? (
            renderPositions()
          ) : (
            <Row>
              <Col colSpan={8}> ---</Col>
            </Row>
          )}
        </tbody>
      </Table>

      {/* <Table headers={headers} data={tableData.flat()} /> */}
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
    </>
  );
}
