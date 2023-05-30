import React, { useEffect, useState } from 'react';
import { LinearInverseInstrumentInfoV5, WalletBalanceV5, WalletBalanceV5Coin } from 'bybit-api';
import SlidePicker from '../Forms/SlidePicker';
import { ITicker } from '../../types';
import Button from '../Button/Button';
import { ITradingService } from '../../services';
import { useDispatch, useSelector } from 'react-redux';
import { Input, NumericInput } from '../Forms';
import tw from 'twin.macro';
import {
  selectTickerInfo,
  selectWallet,
  selectTicker,
  selectTakeProfits,
  selectStopLosses,
  updateTakeProfit,
  updateStopLoss,
  selectPositionSize,
  updatePositionSize,
} from '../../slices';

const Row = tw.div`inline-flex w-full justify-between pb-3`;
const Col = tw.div`flex flex-col md:flex-row items-center gap-x-5`;

interface ICardSymbolProps {
  tradingService: ITradingService;
  longTrade: () => void;
  shortTrade: () => void;
  closeAll: () => void;
}

const CardSymbol: React.FC<ICardSymbolProps> = ({
  tradingService,
  longTrade,
  shortTrade,
  closeAll,
}: ICardSymbolProps) => {

  const dispatch = useDispatch();
  const tickerInfo = useSelector(selectTickerInfo);
  const wallet = useSelector(selectWallet);
  const ticker = useSelector(selectTicker);
  const takeProfits = useSelector(selectTakeProfits);
  const stopLosses = useSelector(selectStopLosses);
  const positionSize = useSelector(selectPositionSize);

  if (!wallet || !tickerInfo || !ticker || !takeProfits || !stopLosses) {
    return <></>;
  }


//   //send data to chart tab
//   useEffect(() => {
//     var limitPriceEmpty = (limitPrice === '' || stopLoss === '' || takeProfit === '')
//     var marketOrderEmpty = (stopLoss === '' || takeProfit === '')

//     if (limitPriceEmpty && orderType === 'limitOrder') {
//         dispatch(setCalcInfo(null));
//         return;
//     } else if (marketOrderEmpty && orderType === 'marketOrder') {
//         dispatch(setCalcInfo(null));
//         return;
//     }
//     if (orderType === 'marketOrder') {

//         dispatch(setCalcInfo({
//             orderType: orderType,
//             stopLoss: stopLoss,
//             takeProfit: takeProfit,
//             price: null,
//             positionType: positionType,
//             checkBox: false,

//         }))
//     } else if (orderType === 'limitOrder') {


//         dispatch(setCalcInfo({
//             orderType: orderType,
//             takeProfit: takeProfit,
//             stopLoss: stopLoss,
//             price: limitPrice,
//             positionType: positionType,
//             checkBox: checkBox,
//         })

//         )
//     }
// }, [stopLoss, takeProfit, limitPrice, positionType, orderType, paramChartClicked, checkBox])


  const coin = wallet.coin[0];
  // useEffect(() => {
  //   if (!symbolInfo) {
  //     return
  //   }

  //   setCoin(wallet.coin[0]);
  //   const minOrderQty = tradingService.convertToNumber(symbolInfo.lotSizeFilter.minOrderQty);
  //   setPositionSize(minOrderQty);
  // }, [symbolInfo]);

  const orderQtyChanged = (value: number) => {
    dispatch(updatePositionSize(value))
  };

  const getMaxOrderQty = (): number => {
    const maxWalletOrderAmmount = parseFloat(coin.availableToWithdraw) / parseFloat(ticker.lastPrice);
    return maxWalletOrderAmmount || 0;
  };

  const takeProfit1 = { ...takeProfits[0] };
  const stopLoss1 = { ...stopLosses[0] };
  const updateTakeProfitHandler = (v: number) => {
    takeProfit1.ticks = v;
    dispatch(updateTakeProfit([takeProfit1]));
  };

  const updateStopLossHandler = (v: number) => {
    stopLoss1.ticks = v;
    dispatch(updateStopLoss([stopLoss1]));
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
      <Row>
        <Col>
          <span>TP</span>
          <span>
            <NumericInput value={takeProfit1.ticks} onChange={updateTakeProfitHandler} />
          </span>
        </Col>
        <Col>
          <span>SL</span>
          <span>
            <NumericInput value={stopLoss1.ticks} onChange={updateStopLossHandler} />
          </span>
        </Col>
      </Row>

      <SlidePicker
        showValue
        min={tradingService.convertToNumber(minOrderQty)}
        value={positionSize}
        max={getMaxOrderQty()}
        step={tradingService.convertToNumber(qtyStep)}
        onValueChange={orderQtyChanged}
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
