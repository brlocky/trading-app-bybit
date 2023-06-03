import { PositionV5 } from 'bybit-api';
import { useDispatch, useSelector } from 'react-redux';
import tw from 'twin.macro';
import { ITradingService } from '../../services';
import { selectPositions, selectTickers, updateSymbol } from '../../slices';
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

const PositionPropContainerLink = tw(PositionPropContainer)`
  cursor-pointer
`;

const PositionRowContainer = tw.div`
grid
bg-green-50
col-span-full
grid-cols-4
border-b-gray-400
border-b-2
`;

const PositionActionsContainer = tw.div`
flex
col-span-full
space-x-4
p-2
justify-end
`;

export default function CardPositions({ tradingService }: ICardPositionsProps) {
  const tickers = useSelector(selectTickers);
  const positions = useSelector(selectPositions);

  const dispatch = useDispatch();

  const headers = ['Ticker', 'Entry', 'Qty/Value', 'P&L'];

  const { closePosition, addStopLoss } = tradingService;

  const renderPositionActions = (p: PositionV5) => {
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
            addStopLoss(p, p.avgPrice);
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

  const renderPositions = () => {
    return positions
      .filter((p) => parseFloat(p.size) > 0)
      .map((p, index) => {
        const currentTicker = tickers[p.symbol]?.ticker;
        const currentTickerInfo = tickers[p.symbol]?.tickerInfo;
        if (!currentTicker) {
          return (
            <PositionRowContainer key={index} onClick={() => dispatch(updateSymbol(p.symbol))}>
              {p.symbol}
            </PositionRowContainer>
          );
        }

        const pnl = calculatePositionPnL(p, currentTicker);
        return (
          <PositionRowContainer key={index}>
            <PositionPropContainerLink onClick={() => dispatch(updateSymbol(p.symbol))}>
              <i className={p.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {p.symbol}
            </PositionPropContainerLink>
            <PositionPropContainer>
              {formatCurrency(p.avgPrice, currentTickerInfo?.priceScale || '0')} ({p.leverage}x)
            </PositionPropContainer>
            <PositionPropContainer>
              {p.size} / {formatCurrency(p.positionValue)} €
            </PositionPropContainer>
            <PositionPropContainer>
              {Number(pnl) >= 0 ? (
                <span className="text-green-600">{formatCurrency(pnl)}</span>
              ) : (
                <span className="text-red-600">{formatCurrency(pnl)}</span>
              )}
              {/* / {formatCurrency(p.cumRealisedPnl)} */}
            </PositionPropContainer>
            {renderPositionActions(p)}
          </PositionRowContainer>
        );
      });
  };

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
        {renderPositions()}
      </PositionsContainer>

      {/* <Table headers={headers} data={tableData.flat()} /> */}
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
    </>
  );
}
