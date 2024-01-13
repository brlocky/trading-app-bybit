import { ClosedPnLV5 } from 'bybit-api';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { selectCurrentOrders, selectInterval } from '../../store/slices';
import { formatCurrencyValue } from '../../utils/tradeUtils';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';
import { AppDispatch } from '../../store';
import { loadSymbol } from '../../store/actions';
import { Link, useNavigate } from 'react-router-dom';

export default function CardClosedPnLs() {
  const [list, setList] = useState<ClosedPnLV5[] | undefined>();
  const apiClient = useApi();
  const dispatch = useDispatch<AppDispatch>();
  const currentOrders = useSelector(selectCurrentOrders);
  const interval = useSelector(selectInterval);
  const navigate = useNavigate();

  const [ordersLength, setOrdersLength] = useState(currentOrders.length);

  useEffect(() => {
    reloadList();
  }, []);

  useEffect(() => {
    if (ordersLength !== currentOrders.length) {
      setOrdersLength(currentOrders.length);
      reloadList();
      console.log('Order lenght changed');
    }
  }, [currentOrders]);

  const reloadList = () => {
    apiClient
      .getClosedPnL({
        category: 'linear',
      })
      .then((r) => {
        setList(r.result.list.splice(0, 50));
      });
  };

  return (
    <>
      <Table>
        <HeaderRow>
          <HeaderCol>Symbol</HeaderCol>
          <HeaderCol>Qty</HeaderCol>
          <HeaderCol>Price</HeaderCol>
          <HeaderCol>PnL</HeaderCol>
          <HeaderCol>Date</HeaderCol>
        </HeaderRow>
        <tbody>
          {list?.length ? (
            list?.map((l, index) => {
              const time = new Date(parseInt(l.createdTime, 10)).toTimeString().split(' ')[0];
              return (
                <Row key={index}>
                  <Col onClick={() => dispatch(loadSymbol(apiClient, navigate, l.symbol))}>
                    <Link to={`/${l.symbol}/${interval}`}>
                      <i className={l.side === 'Sell' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {l.symbol}{' '}
                      ({l.leverage}x)
                    </Link>
                  </Col>
                  <Col>{l.closedSize}</Col>
                  <Col>{formatCurrencyValue(l.avgExitPrice)}</Col>
                  <Col>
                    {Number(l.closedPnl) >= 0 ? (
                      <span className="text-green-600">{formatCurrencyValue(l.closedPnl)}</span>
                    ) : (
                      <span className="text-red-600">{formatCurrencyValue(l.closedPnl)}</span>
                    )}
                  </Col>
                  <Col>{time}</Col>
                </Row>
              );
            })
          ) : (
            <Row>
              <Col colSpan={6}> ---</Col>
            </Row>
          )}
        </tbody>
      </Table>
    </>
  );
}
