interface SettingsData {
  apiKey: string;
  apiSecret: string;
}

export const SettingsService = {
  saveSettings(data: SettingsData) {
    localStorage.setItem("settings", JSON.stringify(data));
  },
  loadSettings(): SettingsData {
    const data = localStorage.getItem("settings");
    if (!data) {
      return {
        apiKey: "some-key",
        apiSecret: "some-secret",
      };
    }
    return JSON.parse(data);
  },
};
