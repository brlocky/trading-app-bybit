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
  armed: boolean;
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
  getDefaultSettings() {
    return {
      apiKey: 'pSRedbNSxAkaofeF4k',
      apiSecret: 'yEBVX8CHLNAxNwaFAJOvW6qdhpyy9u6ea527',
      testnet: true,
    };
  },

  saveSettings(data: ISettingsData) {
    localStorage.setItem('settings', JSON.stringify(data));
  },
  loadSettings(): ISettingsData {
    try {
      const data = localStorage.getItem('settings');
      if (!data) return this.getDefaultSettings();
      return JSON.parse(data);
    } catch (e) {
      console.log('fail to loadSettings');
    }
    return this.getDefaultSettings();
  },

  getDefaultOrderOptions() {
    return {
      armed: false,
      tp: {
        number: 0,
        options: [],
      },
      sl: {
        number: 0,
        options: [],
      },
    };
  },
  saveOrderOptionSettings(data: IOrderOptionsSettingsData) {
    localStorage.setItem('order_option', JSON.stringify(data));
  },
  loadOrderOptionSettings(): IOrderOptionsSettingsData {
    try {
      const data: string | null = localStorage.getItem('order_option');
      if (!data) {
        return this.getDefaultOrderOptions();
      }
      return JSON.parse(data);
    } catch (e) {
      console.log('fail to loadOrderOptionSettings');
    }

    return this.getDefaultOrderOptions();
  },
};
