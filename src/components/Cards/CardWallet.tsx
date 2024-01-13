import React, { HtmlHTMLAttributes } from 'react';
import { useSelector } from 'react-redux';
import { selectLeverage, selectWallet } from '../../store/slices';
import { formatCurrency } from '../../utils/tradeUtils';

type Props = HtmlHTMLAttributes<HTMLDivElement>;

export const CardWallet: React.FC<Props> = (props: Props) => {
  const wallet = useSelector(selectWallet);
  const leverage = useSelector(selectLeverage);

  if (!wallet) {
    return <>no wallet</>;
  }

  const coin = wallet.coin[0];

  return (
    <div className={`flex w-fit gap-x-5 p-1 ${props.className}`}>
      <div className="flex flex-col">
        <span className="text-xs font-light">Equity</span>
        <span className="w-full justify-end">
          <b>{formatCurrency(Number(coin.equity) * leverage)}</b> <span className="text-xs font-light">USDT</span>
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-light">Balance</span>
        <span>
          <b>{formatCurrency(coin.availableToWithdraw)}</b> <span className="text-xs font-light">USDT</span>
        </span>
      </div>
    </div>
  );
};
