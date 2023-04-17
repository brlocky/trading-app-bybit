import React from "react";
import { Card } from "./Card";
import { PositionWSV5, TickerV5 } from "../../types";

interface CardPositionsProps {
  positions: PositionWSV5[];
  price: TickerV5;
}

export default function CardPositions({
  positions,
  price,
}: CardPositionsProps) {
  const formatCurrency = (value: string) => {
    return parseFloat(value).toFixed(2);
  };

  const calculatePL = (position: PositionWSV5, price: TickerV5) => {
    let diff = 0;
    if (position.side === "Sell") {
      diff = parseFloat(position.entryPrice) - parseFloat(price.lastPrice);
    }
    if (position.side === "Buy") {
      diff = parseFloat(price.lastPrice) - parseFloat(position.entryPrice);
    }

    const pl = diff * parseFloat(position.size);

    return pl.toFixed(4);
  };

  return (
    <>
      <Card header={"Positions"}>
        <div className="flex flex-col w-full">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ticker
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Side
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Qty
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Value
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Entry Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Mark Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        P&amp;L
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {positions
                      .filter((p) => parseFloat(p.size) > 0)
                      .map((row) => (
                        <tr key={row.positionIdx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.side}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(row.positionValue)} USDT
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(row.entryPrice)} USDT
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {price.lastPrice !== "0" ? price.lastPrice : row.markPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {calculatePL(row, price)} USDT
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
        </div>
      </Card>
    </>
  );
}
