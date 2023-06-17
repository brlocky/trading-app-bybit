import { ClosedPnLV5 } from 'bybit-api';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useApi } from '../../providers';
import { updateSymbol } from '../../slices';
import { formatCurrencyValue } from '../../utils/tradeUtils';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardClosedPnLs() {
  const [list, setList] = useState<ClosedPnLV5[] | undefined>();
  const apiClient = useApi();
  const dispatch = useDispatch();

  useEffect(() => {
    apiClient
      .getClosedPnL({
        category: 'linear',
      })
      .then((r) => {
        setList(r.result.list.splice(0, 50));
      });
  }, []);

  return (
    <>
      <Table>
        <HeaderRow>
          <HeaderCol>Symbol</HeaderCol>
          <HeaderCol>PnL</HeaderCol>
          <HeaderCol>Date</HeaderCol>
        </HeaderRow>
        <tbody>
          {list?.length ? (
            list?.map((l, index) => {
              return (
                <Row key={index}>
                  <Col onClick={() => dispatch(updateSymbol(l.symbol))}>
                    <i className={l.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {l.symbol} (
                    {l.leverage}x)
                  </Col>
                  <Col>
                    {Number(l.closedPnl) >= 0 ? (
                      <span className="text-green-600">{formatCurrencyValue(l.closedPnl)}</span>
                    ) : (
                      <span className="text-red-600">{formatCurrencyValue(l.closedPnl)}</span>
                    )}
                  </Col>
                  <Col>{new Date(Number(l.updatedTime)).toLocaleTimeString()}</Col>
                </Row>
              );
            })
          ) : (
            <Row>
              <Col colSpan={3}> ---</Col>
            </Row>
          )}
        </tbody>
      </Table>
    </>
  );
}
