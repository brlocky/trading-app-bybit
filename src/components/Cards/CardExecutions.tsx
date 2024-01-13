import { useDispatch, useSelector } from 'react-redux';
import { selectExecutions } from '../../store/slices';
import { formatCurrencyValue } from '../../utils/tradeUtils';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';
import { AppDispatch } from '../../store';
import { loadSymbol } from '../../store/actions';
import { useApi } from '../../providers';
import { useNavigate } from 'react-router-dom';

export default function CardExecutions() {
  const apiClient = useApi();
  const executions = useSelector(selectExecutions);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  return (
    <Table>
      <HeaderRow>
        <HeaderCol>Symbol</HeaderCol>
        <HeaderCol>Action</HeaderCol>
        <HeaderCol>Type</HeaderCol>
        <HeaderCol>Price</HeaderCol>
        <HeaderCol>Qty</HeaderCol>
        <HeaderCol>Fee</HeaderCol>
        {/*         <HeaderCol>PnL</HeaderCol> */}
        <HeaderCol>Date</HeaderCol>
      </HeaderRow>
      <tbody>
        {executions.length ? (
          executions.map((e, index) => {
            const time = new Date(parseInt(e.execTime, 10)).toTimeString().split(' ')[0];
            const actionIsOpen = Number(e.closedSize) === 0;
            const isLimit = e.isMaker;
            const tradeOpenCloseDirection = actionIsOpen ? e.side : e.side === 'Buy' ? 'Sell' : 'Buy';
            /* const closedPnl = 0; */
            return (
              <Row key={index}>
                <Col onClick={() => dispatch(loadSymbol(apiClient, navigate, e.symbol))}>
                  <i
                    className={tradeOpenCloseDirection === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}
                  ></i>{' '}
                  {e.symbol}
                </Col>
                <Col>
                  <span className={actionIsOpen ? '' : 'text-green-200'}>{actionIsOpen ? 'Open' : 'Close'}</span>{' '}
                </Col>
                <Col>
                  <span className={isLimit ? 'text-green-300' : 'text-red-400'}>{isLimit ? 'Limit' : 'Market'}</span>
                </Col>
                <Col>{e.execPrice}</Col>
                <Col>{e.execQty}</Col>
                <Col>
                  <span className="text-red-600">{formatCurrencyValue(e.execFee)}</span>
                </Col>
                {/* <Col>
                  {closedPnl >= 0 ? (
                    <span className="text-green-600">{formatCurrencyValue(closedPnl)}</span>
                  ) : (
                    <span className="text-red-600">{formatCurrencyValue(closedPnl)}</span>
                  )}
                </Col> */}
                <Col>{time}</Col>
              </Row>
            );
          })
        ) : (
          <Row>
            <Col colSpan={8}> ---</Col>
          </Row>
        )}
      </tbody>
    </Table>
  );
}
