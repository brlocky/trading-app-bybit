import React from "react";
import { Input } from "../Forms/Input";
import { Card } from "./Card";
import { SettingsService } from "../../services";

// components

export default function CardPositions() {
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
      <h6 className="text-blueGray-700 text-xl font-bold">
        Account Information
      </h6>
      <button
        className="bg-lightBlue-500 text-white active:bg-lightBlue-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
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
            <div className="w-full lg:w-6/12 px-4">
              <Input
                label="API Key"
                type="text"
                name="apiKey"
                defaultValue={apiKey}
              />
            </div>
            <div className="w-full lg:w-6/12 px-4">
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
