import { useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { IClosePosition, IPositionSide, TradingService } from '../../services';
import { selectCurrentPosition, selectSymbol, selectTicker } from '../../store/slices';
import { calculateClosePositionSize } from '../../utils/tradeUtils';
import Button from '../Button/Button';

export const CardPositionControl: React.FC = () => {
  const currentPosition = useSelector(selectCurrentPosition);
  const symbol = useSelector(selectSymbol);
  const ticker = useSelector(selectTicker);
  const { closePosition } = TradingService(useApi());

  if (!symbol || !ticker || !ticker.ticker || !currentPosition) return <></>;
  const closePrice = currentPosition.side === 'Buy' ? ticker.ticker.ask1Price : ticker.ticker.bid1Price;
  const position: IClosePosition = {
    symbol: symbol as string,
    side: currentPosition.side as IPositionSide,
    qty: currentPosition.size,
    price: closePrice,
  };

  return (
    <>
      <div className="flex w-full justify-end gap-x-2">
        <Button
          disabled={!currentPosition}
          onClick={() => {
            currentPosition &&
              closePosition({
                ...position,
                qty: calculateClosePositionSize(currentPosition, 25),
              });
          }}
          key={25}
        >
          25%
        </Button>
        <Button
          disabled={!currentPosition}
          onClick={() => {
            currentPosition &&
              closePosition({
                ...position,
                qty: calculateClosePositionSize(currentPosition, 50),
              });
          }}
          key={50}
        >
          50%
        </Button>
        <Button
          disabled={!currentPosition}
          onClick={() => {
            currentPosition &&
              closePosition({
                ...position,
                qty: calculateClosePositionSize(currentPosition, 75),
              });
          }}
          key={75}
        >
          75%
        </Button>
        <Button
          disabled={!currentPosition}
          onClick={() => {
            currentPosition && closePosition({ ...position });
          }}
          key={'Close'}
        >
          Close
        </Button>
      </div>
    </>
  );
};
