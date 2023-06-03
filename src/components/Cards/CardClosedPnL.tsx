import { useEffect, useState } from 'react';
import tw from 'twin.macro';
import { useApi } from '../../providers';
import { ClosedPnLV5 } from 'bybit-api';
import { useSelector } from 'react-redux';
import { selectPositions } from '../../slices';
import { formatCurrency } from '../../utils/tradeUtils';

const Container = tw.div`
  grid
  grid-cols-6
  auto-rows-max
`;

const Row = tw.div`
grid
bg-green-50
col-span-full
grid-cols-6
p-1
`;

const Col = tw.div`
col-span-1
self-center
text-left
`;

export default function CardClosedPnLs() {
  const [list, setList] = useState<ClosedPnLV5[] | undefined>();
  const positions = useSelector(selectPositions);
  const apiClient = useApi();

  useEffect(() => {
    apiClient
      .getClosedPnL({
        category: 'linear',
      })
      .then((r) => {
        setList(r.result.list.splice(0, 10));
      });
  }, [positions]);
  return (
    <>
      <h3>Closed PnLs</h3>
      <Container>
        {list?.map((l, index) => {
          const closedPnL = Number(l.closedPnl);
          return (
            <Row key={index}>
              <Col>{l.symbol}</Col>
              <Col>
                {closedPnL >= 0 ? (
                  <span className="text-green-600">{formatCurrency(closedPnL)}</span>
                ) : (
                  <span className="text-red-600">{formatCurrency(closedPnL)}</span>
                )}
              </Col>
              <Col>{new Date(Number(l.updatedTime)).toLocaleTimeString()}</Col>
            </Row>
          );
        })}
      </Container>
      {/* <pre>{JSON.stringify(closedpnls, null, 2)}</pre> */}
    </>
  );
}
