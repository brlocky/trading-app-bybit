import { AccountOrderV5 } from 'bybit-api';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { TradingService } from '../../services';
import { selectOrders, selectPositions, selectTicker, updateSymbol } from '../../slices';
import { calculateOrderPnL, formatCurrencyValue, getOrderPrice, getOrderType, getPositionFromOrder } from '../../utils/tradeUtils';
import Button from '../Button/Button';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardOrders() {
  const tradingService = TradingService(useApi());
  const orders = useSelector(selectOrders);
  const positions = useSelector(selectPositions);
  const tickerInfo = useSelector(selectTicker)?.tickerInfo;
  const dispatch = useDispatch();

  const cancelOrder = (o: AccountOrderV5) => {
    tradingService.closeOrder(o);
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (b.symbol === tickerInfo?.symbol) return 1;
    if (a.symbol === tickerInfo?.symbol) return -1;
    return 0;
  });

  const renderOrders = () =>
    sortedOrders.map((o, index) => {
      const orderType = getOrderType(o);
      const orderPrice = getOrderPrice(o);
      const orderEntry = getPositionFromOrder(positions, o);
      const pnl = orderEntry ? calculateOrderPnL(orderEntry.avgPrice, o) : undefined;

      const tradeDirection = orderType === 'ENTRY' ? o.side : o.side === 'Buy' ? 'Sell' : 'Buy';
      return (
        <Row key={index}>
          <Col onClick={() => dispatch(updateSymbol(o.symbol))}>
            <i className={tradeDirection === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {o.symbol}
          </Col>
          <Col>{orderType}</Col>
          <Col>{o.qty}</Col>
          <Col>{orderPrice}</Col>
          <Col>
            {pnl ? (
              Number(pnl) >= 0 ? (
                <span className="text-green-600">{formatCurrencyValue(pnl)}</span>
              ) : (
                <span className="text-red-600">{formatCurrencyValue(pnl)}</span>
              )
            ) : (
              '-'
            )}
          </Col>
          <Col>
            <Button
              onClick={() => {
                cancelOrder(o);
              }}
            >
              <i className={'fas fa-close'}></i>
            </Button>
          </Col>
        </Row>
      );
    });

  return (
    <Table>
      <HeaderRow>
        <HeaderCol>Ticker</HeaderCol>
        <HeaderCol>Type</HeaderCol>
        <HeaderCol>Qty</HeaderCol>
        <HeaderCol>Price</HeaderCol>
        <HeaderCol>Profit</HeaderCol>
        <HeaderCol>Actions</HeaderCol>
      </HeaderRow>
      <tbody>
        {orders.length ? (
          renderOrders()
        ) : (
          <Row>
            <Col colSpan={8}> --- </Col>
          </Row>
        )}
      </tbody>
    </Table>
  );
}
