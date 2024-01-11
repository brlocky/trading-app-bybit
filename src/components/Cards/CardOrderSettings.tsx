import React, { useState } from 'react';
import { IOrderOptionData } from '../../services';
import { NumericInput, SlidePicker } from '../Forms';
import { SmallText } from '../Text';
import { selectOrderSettings, updateOrderSettings } from '../../slices';
import { useDispatch, useSelector } from 'react-redux';

// components

type OnChangeCallback<T> = (value: T) => void;

export default function CardOrderSettings() {
  const dispatch = useDispatch();

  const renderOptions = (n: number, type: 'TP' | 'SL', options: IOrderOptionData[], onChange: OnChangeCallback<IOrderOptionData>) => {
    let percentageUsed = 0;
    const option = options.find((o) => {
      if (o.number === n) {
        return true;
      }
      percentageUsed += o.percentage;
      return false;
    });
    if (!option) return <>??</>;

    const onChanged = (option: IOrderOptionData) => {
      onChange(option);
    };

    const onTickChange = (n: number) => {
      const o = { ...option, ticks: n };
      onChanged(o);
    };

    const onPercentageChanged = (n: number) => {
      const percentageLeft = 100 - percentageUsed;
      if (n > percentageLeft) {
        n = percentageLeft;
      }
      const o = { ...option, percentage: n };
      onChanged(o);
    };

    return (
      <div className="flex flex-col pb-5">
        <div className="rounded-t-md bg-gray-700 p-1 text-xs text-white">#{n}</div>
        <div className="rounded-b-md border-2 border-t-0 border-solid border-gray-600 p-2">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 text-xs">Ticks</div>
            <div className="col-span-1">
              <SmallText>{option.ticks}</SmallText>
            </div>
            <div className="col-span-6">
              <SlidePicker value={Math.abs(option.ticks)} min={1} max={300} step={1} onValueChanged={onTickChange} />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 text-xs">Percentage</div>
            <div className="col-span-1">
              <SmallText>{option.percentage}%</SmallText>
            </div>
            <div className="col-span-6">
              <SlidePicker value={option.percentage} min={1} max={100} step={1} onValueChanged={onPercentageChanged} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTPLevels = (n: number) => {
    const onOptionChange = (option: IOrderOptionData) => {
      const updatedOptions = takeProfitOptions.map((o) => (o.number === option.number ? option : o));
      setTakeProfitOptions(updatedOptions);

      dispatch(
        updateOrderSettings({
          ...orderSettings,
          tp: {
            number: takeProfits,
            options: updatedOptions,
          },
        }),
      );
    };

    const levels = [];
    for (let i = 1; i <= n; i++) {
      levels.push(renderOptions(i, 'TP', takeProfitOptions, onOptionChange));
    }
    return levels;
  };

  const updateTPs = (n: number) => {
    const options = [...takeProfitOptions];

    if (n < takeProfitOptions.length) {
      options.pop();
      setTakeProfitOptions(options);
    }
    if (n > takeProfitOptions.length) {
      options.push({
        number: n,
        ticks: 1,
        percentage: 0,
      });
      setTakeProfitOptions(options);
    }

    setTakeProfits(n);
    dispatch(
      updateOrderSettings({
        ...orderSettings,
        tp: {
          number: n,
          options: options,
        },
      }),
    );
  };

  const renderSLLevels = (n: number) => {
    const onOptionChange = (option: IOrderOptionData) => {
      option.ticks = 0 - Math.abs(option.ticks);
      const updatedOptions = stopLossesOptions.map((o) => (o.number === option.number ? option : o));
      setStopLossesOptions(updatedOptions);

      dispatch(
        updateOrderSettings({
          ...orderSettings,
          sl: {
            number: stopLosses,
            options: updatedOptions,
          },
        }),
      );
    };

    const levels = [];
    for (let i = 1; i <= n; i++) {
      levels.push(renderOptions(i, 'SL', stopLossesOptions, onOptionChange));
    }
    return levels;
  };

  const updateSLs = (n: number) => {
    const options = [...stopLossesOptions];

    if (n < stopLossesOptions.length) {
      options.pop();
      setStopLossesOptions(options);
    }
    if (n > stopLossesOptions.length) {
      options.push({
        number: n,
        ticks: 1,
        percentage: 0,
      });
      setStopLossesOptions(options);
    }

    setStopLosses(n);
    dispatch(
      updateOrderSettings({
        ...orderSettings,
        sl: {
          number: n,
          options: options,
        },
      }),
    );
  };

  const orderSettings = useSelector(selectOrderSettings);
  const { tp, sl } = orderSettings;

  const [takeProfits, setTakeProfits] = useState<number>(tp.number);
  const [stopLosses, setStopLosses] = useState<number>(sl.number);
  const [takeProfitOptions, setTakeProfitOptions] = useState<IOrderOptionData[]>(tp.options);
  const [stopLossesOptions, setStopLossesOptions] = useState<IOrderOptionData[]>(sl.options);

  return (
    <div className="w-full rounded-md bg-gray-200 p-3">
      <div className="flex w-full flex-col gap-y-3">
        <div className="flex w-full items-center justify-between">
          Take Profits
          <NumericInput
            value={takeProfits}
            onChange={(t) => updateTPs(parseInt((t as React.ChangeEvent<HTMLInputElement>).target.value))}
          />
        </div>
        <div className="flex w-full flex-col">{renderTPLevels(takeProfits)}</div>

        <div className="flex w-full items-center justify-between">
          Stop Losses
          <NumericInput value={stopLosses} onChange={(t) => updateSLs(parseInt((t as React.ChangeEvent<HTMLInputElement>).target.value))} />
        </div>
        <div className="flex w-full flex-col">{renderSLLevels(stopLosses)}</div>
      </div>
    </div>
  );
}
