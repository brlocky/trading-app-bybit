import { ClosedPnLV5 } from 'bybit-api';
import { useEffect, useState } from 'react';
import { useApi } from '../../providers';
import { formatCurrency } from '../../utils/tradeUtils';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardClosedPnLs() {
  const [list, setList] = useState<ClosedPnLV5[] | undefined>();
  const apiClient = useApi();

  useEffect(() => {
    apiClient
      .getClosedPnL({
        category: 'linear',
      })
      .then((r) => {
        setList(r.result.list.splice(0, 20));
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
        {list?.map((l, index) => {
          const closedPnL = Number(l.closedPnl);
          return (
            <Row key={index}>
              <Col>
                <i className={l.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {l.symbol} (
                {l.leverage}x)
              </Col>
              <Col>
                {closedPnL >= 0 ? (
                  <span className="text-green-600">{formatCurrency(closedPnL)} €</span>
                ) : (
                  <span className="text-red-600">{formatCurrency(closedPnL)} €</span>
                )}
              </Col>
              <Col>{new Date(Number(l.updatedTime)).toLocaleTimeString()}</Col>
            </Row>
          );
        })}
      </Table>
    </>
  );
}
