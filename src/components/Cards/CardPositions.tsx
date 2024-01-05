import { useDispatch, useSelector } from 'react-redux';
import { selectOrders, selectPositions, selectTickerInfo, updateSymbol } from '../../slices';
import { formatCurrencyValue } from '../../utils/tradeUtils';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardPositions() {
  const tickerInfo = useSelector(selectTickerInfo);
  const positions = useSelector(selectPositions);
  const orders = useSelector(selectOrders);

  const dispatch = useDispatch();

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

      const pnl = p.unrealisedPnl;
      return (
        <Row key={index}>
          <Col onClick={() => dispatch(updateSymbol(p.symbol))}>
            <i className={p.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {p.symbol} (
            {p.leverage}x)
          </Col>
          <Col>{p.avgPrice}</Col>
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
        <tbody>
          {positions.length ? (
            renderPositions()
          ) : (
            <Row>
              <Col colSpan={9}> ---</Col>
            </Row>
          )}
        </tbody>
      </Table>

      {/* <Table headers={headers} data={tableData.flat()} /> */}
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
    </>
  );
}
