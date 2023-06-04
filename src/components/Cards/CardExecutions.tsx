import { useSelector } from 'react-redux';
import { selectExecutions } from '../../slices';
import { formatCurrency } from '../../utils/tradeUtils';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardExecutions() {
  const executions = useSelector(selectExecutions);

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
              <Col>{l.symbol}</Col>
              <Col>{l.orderType}</Col>
              <Col>{formatCurrency(l.execQty)}</Col>
              <Col>
                <span className="text-red-600">{formatCurrency(closedPnL)} €</span>
              </Col>
              <Col>{new Date(Number(l.execTime)).toLocaleTimeString()}</Col>
            </Row>
          );
        })}
      </tbody>
    </Table>
  );
}
