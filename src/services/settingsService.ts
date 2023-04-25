interface ISettingsData {
  apiKey: string;
  apiSecret: string;
}

export const SettingsService = {
  saveSettings(data: ISettingsData) {
    localStorage.setItem('settings', JSON.stringify(data));
  },
  loadSettings(): ISettingsData {
    const data = localStorage.getItem('settings');
    if (!data) {
      return {
        apiKey: '',
        apiSecret: '',
      };
    }
    return JSON.parse(data);
  },
};
