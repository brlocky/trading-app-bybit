import React from 'react';
import SlidePicker from '../Forms/SlidePicker';
import Button from '../Button/Button';
import { ITradingService } from '../../services';
import { useDispatch, useSelector } from 'react-redux';
import tw from 'twin.macro';
import {
  selectTickerInfo,
  selectWallet,
  selectTicker,
  selectTakeProfits,
  selectStopLosses,
  selectPositionSize,
  updatePositionSize,
  selectLeverage,
} from '../../slices';
import { LeverageSelector, MarginModeSelector, PositionModeSelector } from '../Trade';

const Row = tw.div`inline-flex w-full justify-between pb-3`;
const Col = tw.div`flex flex-col md:flex-row items-center gap-x-5`;

interface ICardSymbolProps {
  tradingService: ITradingService;
  longTrade: () => void;
  shortTrade: () => void;
  closeAll: () => void;
}

const CardSymbol: React.FC<ICardSymbolProps> = ({ tradingService, longTrade, shortTrade, closeAll }: ICardSymbolProps) => {
  const dispatch = useDispatch();
  const tickerInfo = useSelector(selectTickerInfo);
  const wallet = useSelector(selectWallet);
  const leverage = useSelector(selectLeverage);
  const ticker = useSelector(selectTicker);
  const takeProfits = useSelector(selectTakeProfits);
  const stopLosses = useSelector(selectStopLosses);
  const positionSize = useSelector(selectPositionSize);

  if (!wallet || !tickerInfo || !ticker || !takeProfits || !stopLosses) {
    return <></>;
  }

  const coin = wallet.coin[0];

  const orderQtyChanged = (value: number) => {
    dispatch(updatePositionSize(value));
  };

  const getMaxOrderQty = (): number => {
    const maxWalletOrderAmmount = parseFloat(coin.availableToWithdraw) / parseFloat(ticker.lastPrice) * leverage;
    return Math.min(Number(tickerInfo.lotSizeFilter.maxOrderQty), maxWalletOrderAmmount || 0);
  };
  const {
    lotSizeFilter: { minOrderQty, qtyStep },
  } = tickerInfo;

  return (
    <div className="flex flex-col">
      <Row>
        <Col>
          <span>Equity:</span>
          <span className="w-full justify-end">
            <b>{tradingService.formatCurrency(coin.equity)}</b> USDT
          </span>
        </Col>
        <Col>
          <span>Available Balance:</span>
          <span>
            <b>{tradingService.formatCurrency(coin.availableToWithdraw)}</b> USDT
          </span>
        </Col>
      </Row>

      <LeverageSelector />
      <PositionModeSelector />
      <MarginModeSelector />

      <Row>
        <Col></Col>
        <Col></Col>
      </Row>

      <SlidePicker
        showValue
        min={Number(minOrderQty)}
        value={positionSize}
        max={getMaxOrderQty()}
        step={Number(qtyStep)}
        onValueChanged={orderQtyChanged}
      />

      <div className="inline-flex w-full justify-center space-x-4 pt-3">
        <Button onClick={longTrade} className="bg-green-300">
          Long
        </Button>
        <Button onClick={shortTrade} className="bg-red-400">
          Short
        </Button>
        <Button onClick={closeAll}>Close All Orders</Button>
      </div>
      {/* <pre>{JSON.stringify(wallet, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolProps, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolInfo, null, 2)}</pre> */}
    </div>
  );
};

export default CardSymbol;
