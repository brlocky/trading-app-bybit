import React, { useState } from 'react';
import { Input } from '../Forms/Input';
import { Card } from './Card';
import { SettingsService } from '../../services';

// components

export default function CardSettings() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    SettingsService.saveSettings({
      apiKey: form.apiKey.value,
      apiSecret: form.apiSecret.value,
      testnet: isChecked,
    });
  };

  const renderHeader = () => (
    <>
      <h6 className="text-blueGray-700 text-xl font-bold">Account Information</h6>
      <button
        className="bg-lightBlue-500 active:bg-lightBlue-600 mr-1 rounded px-4 py-2 text-xs font-bold uppercase text-white shadow outline-none transition-all duration-150 ease-linear hover:shadow-md focus:outline-none"
        type="submit"
      >
        Save
      </button>
    </>
  );

  const { apiKey, apiSecret, testnet } = SettingsService.loadSettings();

  const [isChecked, setIsChecked] = useState<boolean>(testnet);
  // const { apiKey = 'gmVkzV8nUbDMZLEgq9', apiSecret = 'AcoaLvOQSyZfRFCoFVLMP5DkJnEXP1JOYE0s' } = SettingsService.loadSettings();

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card header={renderHeader()}>
          <div className="flex flex-wrap">
            <div className="w-full px-4 lg:w-6/12">
              <Input label="API Key" type="text" name="apiKey" defaultValue={apiKey} />
            </div>
            <div className="w-full px-4 lg:w-6/12">
              <Input label="API Secret" type="text" name="apiSecret" defaultValue={apiSecret} />
            </div>

            <div className="w-full px-4 lg:w-6/12">
              <div className="relative mb-3 w-full">
                <label className="text-blueGray-600 mb-2 block text-xs font-bold uppercase">TestNet</label>
                <input type="checkbox" name="testnet" checked={isChecked} defaultValue={isChecked ? 1 : 0} onChange={() => setIsChecked(!isChecked)} />
              </div>
            </div>
          </div>
        </Card>
      </form>
    </>
  );
}
