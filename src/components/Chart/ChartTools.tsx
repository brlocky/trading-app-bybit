import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addChartLine, removeChartLine, selectEntryPrice, selectLines } from '../../slices';
import { selectCurrentPosition, selectTickerInfo } from '../../slices/symbolSlice';
import { IChartLine } from '../../types';
import { calculateSLPrice, calculateTPPrice } from '../../utils/tradeUtils';
import Button from '../Button/Button';
import { Modal } from '../Modal';
import { Col, HeaderCol, HeaderRow, Row, Table } from '../Tables';

export const ChartTools: React.FC = () => {
  const currentPosition = useSelector(selectCurrentPosition);
  const entryPrice = useSelector(selectEntryPrice);
  const lines = useSelector(selectLines);

  const tickerInfo = useSelector(selectTickerInfo);

  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();

  const addTP = () => {
    const tpPrice = calculateTPPrice(entryPrice, currentPosition);
    dispatch(addChartLine({ type: 'TP', price: tpPrice }));
  };

  const addSL = () => {
    const slPrice = calculateSLPrice(entryPrice, currentPosition);
    dispatch(addChartLine({ type: 'SL', price: slPrice }));
  };

  const handleRemoveLine = (l: IChartLine, index: number) => {
    console.log('handleRemoveLine', l, index);
    dispatch(removeChartLine({ index }));
  };

  const handleEditButton = () => {
    console.log('handleEditButton');
    setIsOpen(true);
  };

  let tpDisabled = false;
  let slDisabled = false;
  if (!tickerInfo) {
    tpDisabled = true;
    slDisabled = true;
  }

  // if (Number(currentPosition?.takeProfit) > 0) {
  //   tpDisabled = true;
  // }

  // if (Number(currentPosition?.stopLoss) > 0) {
  //   slDisabled = true;
  // }

  // if (takeProfit?.price) {
  //   tpDisabled = true;
  // }

  // if (stopLoss?.price) {
  //   slDisabled = true;
  // }
  return (
    <div className="absolute left-2 top-2 z-10 flex gap-x-2 rounded-lg bg-gray-700 p-2">
      <Button disabled={tpDisabled} onClick={addTP} className="bg-green-200">
        TP
      </Button>
      <Button disabled={slDisabled} onClick={addSL} className="bg-red-400">
        SL
      </Button>
      <Button disabled={!lines.length} onClick={handleEditButton} className="bg-blue-400">
        <i className={'fas fa-edit cursor-pointer'}></i>
      </Button>
      <Modal open={isOpen} header={'Edit'} onClose={() => setIsOpen(false)}>
        <Table>
          <HeaderRow>
            <HeaderCol>Type</HeaderCol>
            <HeaderCol>Price</HeaderCol>
            <HeaderCol>Qty</HeaderCol>
            <HeaderCol>Action</HeaderCol>
          </HeaderRow>
          <tbody>
            {lines.length ? (
              lines.map((l, index) => {
                return (
                  <Row key={index}>
                    <Col>{l.type}</Col>
                    <Col>{l.price}</Col>
                    <Col>{l.qty}</Col>
                    <Col onClick={() => handleRemoveLine(l, index)}>
                      <i className={'fas fa-close cursor-pointer text-xl'}></i>
                    </Col>
                  </Row>
                );
              })
            ) : (
              <Row>
                <Col colSpan={4}>---</Col>
              </Row>
            )}
          </tbody>
        </Table>
      </Modal>
    </div>
  );
};
