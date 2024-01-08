import { useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { TradingService } from '../../services';
import { selectCurrentPosition, selectTicker } from '../../slices';
import { calculateClosePositionSize } from '../../utils/tradeUtils';
import Button from '../Button/Button';

export const CardPositionControl: React.FC = () => {
  const currentPosition = useSelector(selectCurrentPosition);
  const ticker = useSelector(selectTicker);
  const { closePosition } = TradingService(useApi());

  if (!ticker || !ticker.ticker || !currentPosition) return <></>;
  const closePrice = currentPosition?.side === 'Buy' ? ticker.ticker.ask1Price : ticker.ticker.bid1Price;
  return (
    <>
      <div className="flex w-full justify-end gap-x-2 overflow-x-scroll">
        <Button
          disabled={!currentPosition}
          onClick={() => {
            currentPosition && closePosition(currentPosition, calculateClosePositionSize(currentPosition, 25), closePrice);
          }}
          key={25}
        >
          25%
        </Button>
        <Button
          disabled={!currentPosition}
          onClick={() => {
            currentPosition && closePosition(currentPosition, calculateClosePositionSize(currentPosition, 50), closePrice);
          }}
          key={50}
        >
          50%
        </Button>
        <Button
          disabled={!currentPosition}
          onClick={() => {
            currentPosition && closePosition(currentPosition, calculateClosePositionSize(currentPosition, 75), closePrice);
          }}
          key={75}
        >
          75%
        </Button>
        <Button
          disabled={!currentPosition}
          onClick={() => {
            currentPosition && closePosition(currentPosition);
          }}
          key={'Close'}
        >
          Close
        </Button>
      </div>
    </>
  );
};
