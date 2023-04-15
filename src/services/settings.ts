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
        apiKey: "some-key", // kVZ6R9l1sahMMTFJci
        apiSecret: "some-secret", // 5sIhWeYLASW7msJZIXMngFJkarijyLCF9EKt
      };
    }
    return JSON.parse(data);
  },
};
