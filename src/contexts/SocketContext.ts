import {
  ExecutionV5,
  LinearInverseInstrumentInfoV5,
  WalletBalanceV5,
  WebsocketClient,
} from 'bybit-api';
import { createContext } from 'react';
import { IOrder, IPosition, ITicker } from '../types';

export interface ISocketContextState {
  socket: WebsocketClient | undefined;
  ticker: ITicker | undefined;
  tickerInfo: LinearInverseInstrumentInfoV5 | undefined;
  orders: IOrder[];
  wallet: WalletBalanceV5 | undefined;
  positions: IPosition[];
  executions: ExecutionV5[];
}

export const defaultSocketContextState: ISocketContextState = {
  socket: undefined,
  ticker: undefined,
  tickerInfo: undefined,
  orders: [],
  wallet: undefined,
  positions: [],
  executions: [],
};

export type TSocketContextActions =
  | 'update_socket'
  | 'update_ticker'
  | 'update_ticker_info'
  | 'update_wallet'
  | 'update_order'
  | 'update_orders'
  | 'update_executions'
  | 'update_positions';
export type TSocketContextPayload =
  | string
  | string[]
  | WebsocketClient
  | ITicker
  | LinearInverseInstrumentInfoV5
  | IOrder[]
  | IOrder
  | WalletBalanceV5
  | IPosition[]
  | ExecutionV5[];

export interface ISocketContextActions {
  type: TSocketContextActions;
  payload: TSocketContextPayload;
}

export const SocketReducer = (
  state: ISocketContextState,
  action: ISocketContextActions
) => {
  switch (action.type) {
    case 'update_socket':
      return { ...state, socket: action.payload as WebsocketClient };
    case 'update_ticker':
      return {
        ...state,
        ticker: { ...state.ticker, ...(action.payload as ITicker) },
      };
    case 'update_ticker_info':
      return {
        ...state,
        tickerInfo: { ...(action.payload as LinearInverseInstrumentInfoV5) },
      };
    case 'update_wallet':
      return { ...state, wallet: action.payload as WalletBalanceV5 };
    case 'update_orders':
      if (!(action.payload as []).length) {
        return { ...state };
      }
      const currentOrders = [...state.orders];

      (action.payload as IOrder[]).forEach((newOrder) => {
        const index = currentOrders.findIndex(
          (o) => o.orderId === newOrder.orderId
        );

        if (
          ['Rejected', 'Filled', 'Cancelled', 'Triggered'].includes(
            newOrder.orderStatus
          )
        ) {
          // remove Order
          if (index !== -1) {
            currentOrders.splice(index, 1);
          }
        } else {
          if (index !== -1) {
            const currentOrder = { ...currentOrders[index] };
            currentOrders[index] = { ...currentOrder, ...newOrder };
          } else {
            currentOrders.push(newOrder);
          }
        }
      });

      return { ...state, orders: currentOrders };

    case 'update_order':
      const updateOrder = action.payload as IOrder;
      const index = state.orders.findIndex(
        (o) => o.orderId === updateOrder.orderId
      );

      if (index !== -1) {
        const currentOrders = [...state.orders];
        currentOrders[index] = updateOrder;
        return { ...state, orders: currentOrders };
      }
      return { ...state };

    case 'update_executions':
      const currentExecutionOrders = [...state.orders];

      (action.payload as ExecutionV5[]).forEach((execution) => {
        const index = currentExecutionOrders.findIndex(
          (o) => o.orderId === execution.orderId
        );

        // remove Order
        if (index !== -1) {
          currentExecutionOrders.splice(index, 1);
        }
      });

      return {
        ...state,
        orders: currentExecutionOrders,
      };
    case 'update_positions':
      return {
        ...state,
        positions: [...(action.payload as IPosition[])],
      };

    default:
      return state;
  }
};

export interface ISocketContextProps {
  SocketState: ISocketContextState;
  SocketDispatch: React.Dispatch<ISocketContextActions>;
}

const SocketContext = createContext<ISocketContextProps>({
  SocketState: defaultSocketContextState,
  SocketDispatch: () => {},
});

export const SocketContextConsumer = SocketContext.Consumer;
export const SocketContextProvider = SocketContext.Provider;

export default SocketContext;
