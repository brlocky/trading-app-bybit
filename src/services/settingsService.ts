interface ISettingsData {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

interface ISettingsData {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

export interface IOrderOptionsSettingsData {
  tp: IOrderOptionSettingsData;
  sl: IOrderOptionSettingsData;
}

export interface IOrderOptionSettingsData {
  number: number;
  options: IOrderOptionData[];
}

export interface IOrderOptionData {
  number: number;
  ticks: number;
  percentage: number;
}

export const SettingsService = {
  saveSettings(data: ISettingsData) {
    localStorage.setItem('settings', JSON.stringify(data));
  },
  loadSettings(): ISettingsData {
    const data = localStorage.getItem('settings');
    if (!data) {
      return {
        apiKey: 'pSRedbNSxAkaofeF4k',
        apiSecret: 'yEBVX8CHLNAxNwaFAJOvW6qdhpyy9u6ea527',
        testnet: true,
      };
    }
    return JSON.parse(data);
  },

  saveOrderOptionSettings(data: IOrderOptionsSettingsData) {
    localStorage.setItem('order_option', JSON.stringify(data));
  },
  loadOrderOptionSettings(): IOrderOptionsSettingsData {
    const data = localStorage.getItem('order_option');
    if (!data) {
      const orderOptionDefaultSettings = {
        tp: {
          number: 0,
          options: [],
        },
        sl: {
          number: 0,
          options: [],
        },
      };

      return orderOptionDefaultSettings;
    }
    return JSON.parse(data);
  },
};
