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

  const coin = wallet.coin.find((c) => c.coin === 'USDT');
  if (!coin) return <></>;
  return (
    <div className={`flex w-fit gap-x-5 p-1 ${props.className}`}>
      <div className="flex flex-col">
        <span className="text-xs font-light">Balance / Available</span>
        <span>
          <b>{formatCurrency(Number(coin.equity))}</b> / <b>{formatCurrency(coin.availableToWithdraw)}</b>{' '}
          <span className="text-xs font-light">USDT</span>
        </span>
      </div>
    </div>
  );
};
