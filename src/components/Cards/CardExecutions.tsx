import { useSelector } from 'react-redux';
import tw from 'twin.macro';
import { selectExecutions } from '../../slices';
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

export default function CardExecutions() {
  const executions = useSelector(selectExecutions);

  return (
    <>
      <h3>Executions Fees</h3>
      <Container>
        {executions?.map((l, index) => {
          const closedPnL = Number(l.execFee);
          return (
            <Row key={index}>
              <Col>{l.symbol}</Col>
              <Col>{formatCurrency(l.execValue)}</Col>
              <Col>
                <span className="text-red-600">{formatCurrency(closedPnL)}</span>
              </Col>
              <Col>{new Date(Number(l.execTime)).toLocaleTimeString()}</Col>
            </Row>
          );
        })}
      </Container>
      {/* <pre>{JSON.stringify(executions, null, 2)}</pre> */}
    </>
  );
}
