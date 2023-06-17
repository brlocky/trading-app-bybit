import React, { useState } from 'react';
import { Input } from '../Forms/Input';
import { Card } from './Card';
import { SettingsService } from '../../services';
import Button from '../Button/Button';
import { useNavigate } from 'react-router';

// components

export default function CardSettings() {
  const navigate = useNavigate();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    SettingsService.saveSettings({
      apiKey: form.apiKey.value,
      apiSecret: form.apiSecret.value,
      testnet: isChecked,
    });

    navigate('/');
    navigate(0);
  };

  const renderHeader = () => (
    <>
      <div className="flex flex-col">
        <h6 className="text-blueGray-700 text-xl font-bold">Add your Bybit API Key and Secret</h6>
      </div>
      <Button className="" type="submit">
        Save
      </Button>
    </>
  );

  const { apiKey, apiSecret, testnet } = SettingsService.loadSettings();

  const [isChecked, setIsChecked] = useState<boolean>(testnet);
  return (
    <>
      <form onSubmit={handleSubmit} className="m-10 flex w-full">
        <Card header={renderHeader()}>
          <div className="flex w-full flex-col gap-y-13 mt-10">
            <div className="w-full px-4">
              <Input label="API Key" type="password" name="apiKey" defaultValue={apiKey} />
            </div>
            <div className="2 w-full px-4">
              <Input label="API Secret" type="password" name="apiSecret" defaultValue={apiSecret} />
            </div>

            <div className="w-full px-4 ">
              <div className="relative mb-3 w-full">
                <label className="text-blueGray-600 mb-2 block text-xs font-bold uppercase">TestNet</label>
                <input
                  type="checkbox"
                  name="testnet"
                  checked={isChecked}
                  defaultValue={isChecked ? 1 : 0}
                  onChange={() => setIsChecked(!isChecked)}
                />
              </div>
            </div>
          </div>
        </Card>
      </form>
    </>
  );
}
