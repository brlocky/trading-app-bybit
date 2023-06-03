import { OrderTypeV5 } from 'bybit-api';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectOrderType, updateOrderType } from '../../slices';
import { ToggleInput } from '../Forms';

export const OrderTypeSelector: React.FC = () => {
  const dispatch = useDispatch();
  const orderType = useSelector(selectOrderType);

  const data = [
    { name: 'Market', value: 'Market' },
    { name: 'Limit', value: 'Limit' },
  ];

  const onChangeHandler = (type: string) => {
    dispatch(updateOrderType(type as OrderTypeV5));
  };

  return (
    <div className="flex flex-col">
      <h1>Order Type</h1>

      <span>
        <ToggleInput toggles={data} defaultToggle={orderType} onChange={onChangeHandler} />
      </span>
    </div>
  );
};
