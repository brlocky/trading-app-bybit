import React from 'react';
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
    });
  };

  const renderHeader = () => (
    <>
      <h6 className="text-xl font-bold text-blueGray-700">
        Account Information
      </h6>
      <button
        className="px-4 py-2 mr-1 text-xs font-bold text-white uppercase rounded shadow outline-none bg-lightBlue-500 active:bg-lightBlue-600 hover:shadow-md focus:outline-none ease-linear transition-all duration-150"
        type="submit"
      >
        Save
      </button>
    </>
  );
  const { apiKey, apiSecret } = SettingsService.loadSettings();

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card header={renderHeader()}>
          <div className="flex flex-wrap">
            <div className="w-full px-4 lg:w-6/12">
              <Input
                label="API Key"
                type="text"
                name="apiKey"
                defaultValue={apiKey}
              />
            </div>
            <div className="w-full px-4 lg:w-6/12">
              <Input
                label="API Secret"
                type="text"
                name="apiSecret"
                defaultValue={apiSecret}
              />
            </div>
          </div>
        </Card>
      </form>
    </>
  );
}
