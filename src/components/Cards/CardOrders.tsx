import { AccountOrderV5 } from 'bybit-api';
import { useSelector } from 'react-redux';
import tw from 'twin.macro';
import { selectOrders, selectPositions, selectTickerInfo } from '../../slices';
import { calculateOrderPnL, formatCurrency, getOrderEntryFromPositions, isOrderStopLossOrTakeProfit } from '../../utils/tradeUtils';
import Button from '../Button/Button';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardOrders() {
  const orders = useSelector(selectOrders);
  const positions = useSelector(selectPositions);
  const tickerInfo = useSelector(selectTickerInfo);

  const cancelOrder = (o: AccountOrderV5) => {
    console.log('cancel Order', o);
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (b.symbol === tickerInfo?.symbol) return 1;
    if (a.symbol === tickerInfo?.symbol) return -1;
    return 0;
  });

  const renderOrders = sortedOrders.map((o, index) => {
    const isTrigger = isOrderStopLossOrTakeProfit(o);

    const orderEntry = getOrderEntryFromPositions(positions, o);
    const pnl = calculateOrderPnL(orderEntry, o);
    return (
      <Row key={index}>
        <Col>
          <i className={o.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {o.symbol}
        </Col>
        <Col>{isTrigger ? o.stopOrderType : o.side}</Col>
        <Col>{o.qty}</Col>

        <Col>{isTrigger ? o.triggerPrice : o.price}</Col>
        <Col>
          {pnl ? (
            parseFloat(pnl) >= 0 ? (
              <span className="text-green-600">{formatCurrency(pnl)}</span>
            ) : (
              <span className="text-red-600">{formatCurrency(pnl)}</span>
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

      {renderOrders}
    </Table>
  );
}
