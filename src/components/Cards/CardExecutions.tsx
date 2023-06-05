import { useDispatch, useSelector } from 'react-redux';
import { selectExecutions, updateSymbol } from '../../slices';
import { formatCurrency } from '../../utils/tradeUtils';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardExecutions() {
  const executions = useSelector(selectExecutions);
  const dispatch = useDispatch()
  
  return (
    <Table>
      <HeaderRow>
        <HeaderCol>Symbol</HeaderCol>
        <HeaderCol>Type</HeaderCol>
        <HeaderCol>Qty</HeaderCol>
        <HeaderCol>PnL</HeaderCol>
        <HeaderCol>Date</HeaderCol>
      </HeaderRow>
      <tbody>
        {executions?.map((l, index) => {
          const closedPnL = Number(l.execFee);
          return (
            <Row key={index}>
              <Col onClick={() => dispatch(updateSymbol(l.symbol))}>{l.symbol}</Col>
              <Col>{l.orderType}</Col>
              <Col>{formatCurrency(l.execQty)}</Col>
              <Col>
                <span className="text-red-600">{formatCurrency(closedPnL)} USDT</span>
              </Col>
              <Col>{new Date(Number(l.execTime)).toLocaleTimeString()}</Col>
            </Row>
          );
        })}
      </tbody>
    </Table>
  );
}
