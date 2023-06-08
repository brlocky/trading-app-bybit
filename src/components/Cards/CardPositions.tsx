import { useDispatch, useSelector } from 'react-redux';
import { selectPositions, selectTickerInfo, selectTickers, updateSymbol } from '../../slices';
import { calculatePositionPnL, formatCurrency, formatCurrencyValue } from '../../utils/tradeUtils';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardPositions() {
  const tickers = useSelector(selectTickers);
  const tickerInfo = useSelector(selectTickerInfo);
  const positions = useSelector(selectPositions);

  const dispatch = useDispatch();

  const renderPositions = () => {
    const sortedPositions = [...positions].sort((a, b) => {
      if (b.symbol === tickerInfo?.symbol) return 1;
      if (a.symbol === tickerInfo?.symbol) return -1;
      return 0;
    });

    return sortedPositions.map((p, index) => {
      const currentTicker = tickers[p.symbol]?.ticker;
      const currentTickerInfo = tickers[p.symbol]?.tickerInfo;

      const pnl = currentTicker ? calculatePositionPnL(p, currentTicker) : 0;
      return (
        <Row key={index}>
          <Col onClick={() => dispatch(updateSymbol(p.symbol))}>
            <i className={p.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {p.symbol} (
            {p.leverage}x)
          </Col>
          <Col>{formatCurrency(p.avgPrice, currentTickerInfo?.priceScale || '0')}</Col>
          <Col>{p.size}</Col>
          <Col>{formatCurrencyValue(p.positionValue)}</Col>
          <Col>
            {Number(p.takeProfit) ? p.takeProfit : '-'} / {Number(p.stopLoss) ? p.stopLoss : '-'}
          </Col>
          <Col>
            {Number(pnl) >= 0 ? (
              <span className="text-green-600">{formatCurrencyValue(pnl)}</span>
            ) : (
              <span className="text-red-600">{formatCurrencyValue(pnl)}</span>
            )}
            {/* / {formatCurrency(p.cumRealisedPnl)} */}
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
        </HeaderRow>
        <tbody> { positions.length ? renderPositions() : <Row><Col colSpan={6}> ---</Col></Row>}</tbody>
      </Table>

      {/* <Table headers={headers} data={tableData.flat()} /> */}
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
    </>
  );
}
