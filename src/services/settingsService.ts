interface ISettingsData {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
}

export const SettingsService = {
  saveSettings(data: ISettingsData) {
    localStorage.setItem('settings', JSON.stringify(data));
  },
  loadSettings(): ISettingsData {
    const data = localStorage.getItem('settings');
    if (!data) {
      return {
        apiKey: 'gmVkzV8nUbDMZLEgq9',
        apiSecret: 'AcoaLvOQSyZfRFCoFVLMP5DkJnEXP1JOYE0s',
        testnet: true,
      };
    }
    return JSON.parse(data);
  },
};
