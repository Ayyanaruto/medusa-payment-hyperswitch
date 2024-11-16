import { ReactNode } from 'react';
import { Tabs } from "@medusajs/ui";

const TabsContainer = ({ children }: { children: ReactNode }) => (
  <Tabs defaultValue="configuration">
    <Tabs.List>
      <Tabs.Trigger value="configuration">Configuration</Tabs.Trigger>
      <Tabs.Trigger value="proxy_configuration">
        Proxy Configuration
      </Tabs.Trigger>
      <Tabs.Trigger value="customisation">Customisation</Tabs.Trigger>
      <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
    </Tabs.List>
    {children}
  </Tabs>
);

export default TabsContainer;
