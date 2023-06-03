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
  const tickers = useSelector(selectTickers);
  const positions = useSelector(selectPositions);

  const dispatch = useDispatch();

  const headers = ['Ticker', 'Entry', 'Qty', 'P&L'];

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
          <PositionRowContainer key={index} onClick={() => dispatch(updateSymbol(p.symbol))}>
            <PositionPropContainer>
              <i className={p.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {p.symbol}
            </PositionPropContainer>
            <PositionPropContainer>{formatCurrency(p.avgPrice, currentTickerInfo?.priceScale || '0')}</PositionPropContainer>
            <PositionPropContainer>{p.size}</PositionPropContainer>
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
