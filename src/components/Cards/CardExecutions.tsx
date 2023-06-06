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
        <HeaderCol>Price</HeaderCol>
        <HeaderCol>Qty</HeaderCol>
        <HeaderCol>PnL</HeaderCol>
        <HeaderCol>Date</HeaderCol>
      </HeaderRow>
      <tbody>
        {executions?.map((e, index) => {
          const closedPnL = Number(e.execFee);
          console.log(e);
          return (
            <Row key={index}>
              <Col onClick={() => dispatch(updateSymbol(e.symbol))}>{e.symbol}</Col>
              <Col>{e.orderType as string !== 'UNKNOWN' ? e.orderType : e.execType}</Col>
              <Col>{e.execPrice}</Col>
              <Col>{formatCurrency(e.execQty)}</Col>
              <Col>
                <span className="text-red-600">{formatCurrency(closedPnL)} USDT</span>
              </Col>
              <Col>{new Date(Number(e.execTime)).toLocaleTimeString()}</Col>
            </Row>
          );
        })}
      </tbody>
    </Table>
  );
}
