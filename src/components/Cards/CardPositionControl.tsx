import { useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { TradingService } from '../../services';
import { selectCurrentPosition } from '../../slices';
import { calculateClosePositionSize } from '../../utils/tradeUtils';
import Button from '../Button/Button';

export const CardPositionControl: React.FC = () => {
  const p = useSelector(selectCurrentPosition);
  const { closePosition } = TradingService(useApi());

  return (
    <>
      <div className="flex w-full gap-x-2 overflow-x-scroll justify-end">
        <Button
          disabled={!p}
          onClick={() => {
            p && closePosition(p, calculateClosePositionSize(p, 25));
          }}
          key={25}
        >
          25%
        </Button>
        <Button
          disabled={!p}
          onClick={() => {
            p && closePosition(p, calculateClosePositionSize(p, 50));
          }}
          key={50}
        >
          50%
        </Button>
        <Button
          disabled={!p}
          onClick={() => {
            p && closePosition(p, calculateClosePositionSize(p, 75));
          }}
          key={75}
        >
          75%
        </Button>
        <Button
          disabled={!p}
          onClick={() => {
            p && closePosition(p);
          }}
          key={'Close'}
        >
          Close
        </Button>
      </div>
    </>
  );
};
