import React from 'react';
import { Card } from './Card';
import { WalletBalanceV5 } from 'bybit-api';

interface ICardWalletsProps {
  wallet?: WalletBalanceV5;
}

export default function CardWallets({ wallet }: ICardWalletsProps) {
  const formatCurrency = (value: string) => {
    return parseFloat(value).toFixed(4);
  };

  const coin = wallet?.coin[0];

  return (
    <>
      <Card header={'Wallets'}>
        <h1>
          {wallet?.accountType} / {coin?.coin}
        </h1>
        <h2>Equity {formatCurrency(coin?.equity || '0')} USDT </h2>
        <h2>
          Available Balance {formatCurrency(coin?.availableToWithdraw || '0')}{' '}
          USDT
        </h2>
        {/* <pre>{JSON.stringify(wallet, null, 2)}</pre> */}
      </Card>
    </>
  );
}
