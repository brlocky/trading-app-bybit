import React, { useState } from 'react';
import { IOrderOptionData, SettingsService } from '../../services';
import { useNavigate } from 'react-router';
import { LockerInput, NumericInput, SlidePicker } from '../Forms';
import { SmallText } from '../Text';

// components

type OnChangeCallback<T> = (value: T) => void;

export default function CardOrderSettings() {
  const navigate = useNavigate();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    /* const form = event.currentTarget;
    SettingsService.saveSettings({
      apiKey: form.apiKey.value,
      apiSecret: form.apiSecret.value,
      testnet: isChecked,
    });

    navigate('/');
    navigate(0); */
  };

  const renderOptions = (n: number, options: IOrderOptionData[], onChange: OnChangeCallback<IOrderOptionData>) => {
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
        <div className="rounded-md bg-gray-700 p-1 text-white">#{n}</div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5">Ticks</div>
          <div className="col-span-1">
            <SmallText>{option.ticks}</SmallText>
          </div>
          <div className="col-span-6">
            <SlidePicker value={option.ticks} min={0} max={100} step={1} onValueChanged={onTickChange} />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5">Close Percentage</div>
          <div className="col-span-1">
            <SmallText>{option.percentage}%</SmallText>
          </div>
          <div className="col-span-6">
            <SlidePicker value={option.percentage} min={0} max={100} step={1} onValueChanged={onPercentageChanged} />
          </div>
        </div>
      </div>
    );
  };

  const renderTPLevels = (n: number) => {
    const onOptionChange = (option: IOrderOptionData) => {
      const updatedOptions = takeProfitOptions.map((o) => (o.number === option.number ? option : o));
      setTakeProfitOptions(updatedOptions);

      SettingsService.saveOrderOptionSettings({
        tp: {
          number: takeProfits,
          options: updatedOptions,
        },
        sl: {
          number: stopLosses,
          options: stopLossesOptions,
        },
      });
    };

    const levels = [];
    for (let i = 1; i <= n; i++) {
      levels.push(renderOptions(i, takeProfitOptions, onOptionChange));
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
  };

  const renderSLLevels = (n: number) => {
    const onOptionChange = (option: IOrderOptionData) => {
      const updatedOptions = stopLossesOptions.map((o) => (o.number === option.number ? option : o));
      setStopLossesOptions(updatedOptions);

      SettingsService.saveOrderOptionSettings({
        tp: {
          number: takeProfits,
          options: takeProfitOptions,
        },
        sl: {
          number: stopLosses,
          options: updatedOptions,
        },
      });
    };

    const levels = [];
    for (let i = 1; i <= n; i++) {
      levels.push(renderOptions(i, stopLossesOptions, onOptionChange));
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
  };

  const { tp, sl } = SettingsService.loadOrderOptionSettings();

  const [takeProfits, setTakeProfits] = useState<number>(tp.number);
  const [stopLosses, setStopLosses] = useState<number>(sl.number);
  const [takeProfitOptions, setTakeProfitOptions] = useState<IOrderOptionData[]>(tp.options);
  const [stopLossesOptions, setStopLossesOptions] = useState<IOrderOptionData[]>(sl.options);

  return (
    <div className="w-full rounded-md bg-gray-200 p-3">
      <form onSubmit={handleSubmit}>
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
            <NumericInput
              value={stopLosses}
              onChange={(t) => updateSLs(parseInt((t as React.ChangeEvent<HTMLInputElement>).target.value))}
            />
          </div>
          <div className="flex w-full flex-col">{renderSLLevels(stopLosses)}</div>
        </div>
      </form>
    </div>
  );
}
