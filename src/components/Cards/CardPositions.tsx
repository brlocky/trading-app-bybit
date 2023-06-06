import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { TradingService } from '../../services';
import { selectPositions, selectTickerInfo, selectTickers, updateSymbol } from '../../slices';
import { calculateClosePositionSize, calculatePositionPnL, formatCurrency, formatCurrencyValue } from '../../utils/tradeUtils';
import Button from '../Button/Button';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export default function CardPositions() {
  const tickers = useSelector(selectTickers);
  const tickerInfo = useSelector(selectTickerInfo);
  const positions = useSelector(selectPositions);
  const { closePosition, addStopLoss } = TradingService(useApi());

  const dispatch = useDispatch();

  const renderPositions = () => {
    const sortedPositions = [...positions].sort((a, b) => {
      if (b.symbol === tickerInfo?.symbol) return 1;
      if (a.symbol === tickerInfo?.symbol) return -1;
      return 0;
    });

    return sortedPositions.map((p, index) => {
      const currentTicker = tickers[p.symbol]?.ticker;
      const currentTickerInfo = tickers[p.symbol]?.tickerInfo;
      if (!currentTicker) {
        return (
          <Row key={index} onClick={() => dispatch(updateSymbol(p.symbol))}>
            <Col>{p.symbol}</Col>
          </Row>
        );
      }

      const pnl = calculatePositionPnL(p, currentTicker);
      return [
        <Row key={index}>
          <Col onClick={() => dispatch(updateSymbol(p.symbol))}>
            <i className={p.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'}></i> {p.symbol} (
            {p.leverage}x)
          </Col>
          <Col>{formatCurrency(p.avgPrice, currentTickerInfo?.priceScale || '0')}</Col>
          <Col>{p.size}</Col>
          <Col>{formatCurrencyValue(p.positionValue)}</Col>
          <Col>
            {Number(p.takeProfit) ? p.takeProfit : '-'} / {Number(p.stopLoss) ? p.stopLoss : '-'}
          </Col>
          <Col>
            {Number(pnl) >= 0 ? (
              <span className="text-green-600">{formatCurrencyValue(pnl)}</span>
            ) : (
              <span className="text-red-600">{formatCurrencyValue(pnl)}</span>
            )}
            {/* / {formatCurrency(p.cumRealisedPnl)} */}
          </Col>
        </Row>,
        <Row key={`${index}_buttons`}>
          <Col colSpan={6}>
            <div className="flex w-full justify-end gap-x-2">
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
            </div>
          </Col>
        </Row>,
      ];
    });
  };

  return (
    <>
      <Table>
        <HeaderRow>
          <HeaderCol>Ticker</HeaderCol>
          <HeaderCol>Entry</HeaderCol>
          <HeaderCol>Size</HeaderCol>
          <HeaderCol>Value</HeaderCol>
          <HeaderCol>TP / SL</HeaderCol>
          <HeaderCol>PnL</HeaderCol>
        </HeaderRow>
        <tbody>{renderPositions()}</tbody>
      </Table>

      {/* <Table headers={headers} data={tableData.flat()} /> */}
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
    </>
  );
}
