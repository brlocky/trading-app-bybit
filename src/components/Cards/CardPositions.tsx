import { LinearPositionIdx } from 'bybit-api';
import { useSelector } from 'react-redux';
import tw from 'twin.macro';
import { ITradingService } from '../../services';
import { selectPositions, selectTicker } from '../../slices';
import { IPosition } from '../../types';
import { calculateClosePositionSize, calculatePositionPnL, formatCurrency } from '../../utils/tradeUtils';
import Button from '../Button/Button';

interface ICardPositionsProps {
  tradingService: ITradingService;
}

const PositionsContainer = tw.div`
  grid
  grid-cols-4
  auto-rows-max
`;

const PositionPropContainer = tw.div`
  grid-cols-1
  p-2
`;

const PositionRowContainer = tw.div`
grid
bg-green-50
col-span-4
grid-cols-4
`;

const PositionActionsContainer = tw.div`
col-span-full
flex
justify-between
space-x-4
w-full
p-2
border-b-gray-400
border-b-2
border-t-2
`;

export default function CardPositions({ tradingService }: ICardPositionsProps) {
  const ticker = useSelector(selectTicker);
  const positions = useSelector(selectPositions);

  if (!ticker) {
    return <></>;
  }
  const headers = ['Ticker', 'Entry', 'Qty', 'P&L'];

  const { closePosition, addStopLoss } = tradingService;

  const renderPositionActions = (p: IPosition) => {
    const closePrice = p.side === 'Buy' ? ticker.ask1Price : ticker.bid1Price;
    return (
      <PositionActionsContainer>
        <Button
          onClick={() => {
            closePosition(p, calculateClosePositionSize(p, 25));
          }}
          key={25}
        >
          25%
        </Button>
        <Button
          onClick={() => {
            closePosition(p, calculateClosePositionSize(p, 50));
          }}
          key={50}
        >
          50%
        </Button>
        <Button
          onClick={() => {
            closePosition(p, calculateClosePositionSize(p, 75));
          }}
          key={75}
        >
          75%
        </Button>
        <Button
          onClick={() => {
            closePosition(p, calculateClosePositionSize(p, 100));
          }}
          key={100}
        >
          100%
        </Button>
        <Button
          onClick={() => {
            addStopLoss(p, p.entryPrice);
          }}
          key={'BE'}
        >
          BE
        </Button>
        <Button
          onClick={() => {
            closePosition(p);
          }}
          key={'Close'}
        >
          Close
        </Button>
      </PositionActionsContainer>
    );
  };

  const renderPositions = positions
    .filter((p) => parseFloat(p.size) > 0)
    .map((p, index) => {
      return (
        <PositionRowContainer key={index}>
          <PositionPropContainer>
            <i className={p.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {p.symbol}
          </PositionPropContainer>
          <PositionPropContainer>{formatCurrency(p.entryPrice)}</PositionPropContainer>
          <PositionPropContainer>{p.size}</PositionPropContainer>
          <PositionPropContainer>
            {parseFloat(calculatePositionPnL(p, ticker)) >= 0 ? (
              <span className="text-green-600">{formatCurrency(calculatePositionPnL(p, ticker))}</span>
            ) : (
              <span className="text-red-600">{formatCurrency(calculatePositionPnL(p, ticker))}</span>
            )}
          </PositionPropContainer>
          {renderPositionActions(p)}
        </PositionRowContainer>
      );
    });

  const renderHeader = headers.map((h, index) => (
    <PositionPropContainer key={index} className="bg-gray-100">
      {h}
    </PositionPropContainer>
  ));

  return (
    <>
      <h3>Positions</h3>

      <PositionsContainer>
        {renderHeader}
        {renderPositions}
      </PositionsContainer>

      {/* <Table headers={headers} data={tableData.flat()} /> */}
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
    </>
  );
}
