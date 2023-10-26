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
        apiKey: 'pSRedbNSxAkaofeF4k',
        apiSecret: 'yEBVX8CHLNAxNwaFAJOvW6qdhpyy9u6ea527',
        testnet: true,
      };
    }
    return JSON.parse(data);
  },
};
