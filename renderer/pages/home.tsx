import React, { useEffect } from "react";
import Head from "next/head";
import { Code, Tab, Tabs } from "@nextui-org/react";
import HomeTab from "../components/HomeTab";
import SettingsTab from "../components/SettingsTab";
import { RiHome2Fill, RiSettings2Fill } from "react-icons/ri";
import { useSettingStore } from "../stores/setting-store";
import { useGlobalStore } from "../stores/global-store";
import { MESSAGES } from "../messages";

export default function HomePage() {
  const loadSettings = useSettingStore((state) => state.loadSettings);
  const { hideSticky } = useGlobalStore();

  useEffect(() => {
    window.ipc.invoke("mainWindow.ready", true).then(() => {
      window.ipc.on("setting.load", (settings) => {
        loadSettings(settings);
      });
    });

    window.ipc.on("stickyWindow.hided", () => {
      hideSticky();
    });
  }, []);

  return (
    <div className="bg-gray-200 min-h-screen p-10 mx-auto">
      <Head>
        <title></title>
      </Head>
      <Tabs aria-label="Options" color="primary" variant="solid">
        <Tab
          key="home"
          title={
            <div className="flex items-center space-x-2">
              <RiHome2Fill />
              <span>{MESSAGES.HOME_TAB}</span>
            </div>
          }
        >
          <HomeTab />
        </Tab>
        <Tab
          key="settings"
          title={
            <div className="flex items-center space-x-2">
              <RiSettings2Fill />
              <span>{MESSAGES.SETTINGS_TAB}</span>
            </div>
          }
        >
          <SettingsTab />
        </Tab>
      </Tabs>
      <Code
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        title={MESSAGES.COPYRIGHT}
      >
        {MESSAGES.DEVELOPED_BY}
      </Code>
    </div>
  );
}
