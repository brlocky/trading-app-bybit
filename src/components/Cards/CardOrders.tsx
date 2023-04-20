import React from "react";
import { Card } from "./Card";
import { IOrder } from "../../types";
import Button from "../Button/Button";

interface ICardOrdersProps {
  orders: IOrder[];
  cancelOrder: (o: IOrder) => void;
}

export default function CardOrders({ orders, cancelOrder }: ICardOrdersProps) {
  return (
    <>
      <Card header={"Orders"}>
        <div className="flex flex-col w-full">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Order Id
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Qty
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Order Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Trade Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders
                      .filter((o) => o.cancelType !== null)
                      .sort(
                        (a: IOrder, b: IOrder) =>
                          parseFloat(b.price) - parseFloat(a.price)
                      )
                      .map((order: IOrder) => (
                        <tr key={order.orderId}>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {order.orderId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {order.qty}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {order.price}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {order.side}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            <Button onClick={() => cancelOrder(order)}>
                              Cancel
                            </Button>
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
