'use client';
import { QueryClient } from '@tanstack/react-query';
import { MedusaProvider } from 'medusa-react';
import type { SettingConfig } from '@medusajs/admin';
import { Heading, Container, Toaster, Tabs } from '@medusajs/ui';

import HyperswitchForm from '../../components/HyperSwitchForm';
import Customisation from '../../components/Customization';
import ProxyForm from '../../components/ProxyForm';
import { Logger } from '../../components/Logger';
import icons from '../../icons';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const TabsContainer = ({ children }) => (
  <Tabs defaultValue='configuration'>
    <Tabs.List>
      <Tabs.Trigger value='configuration'>Configuration</Tabs.Trigger>
      <Tabs.Trigger value='proxy_confiuguration'>Proxy Configuration</Tabs.Trigger>
      <Tabs.Trigger value='customisation'>Customisation</Tabs.Trigger>
      <Tabs.Trigger value='logs'>Logs</Tabs.Trigger>
    </Tabs.List>
    {children}
  </Tabs>
);
const CustomSettingPage = () => {
  return (
    <MedusaProvider
      queryClientProviderProps={{ client: queryClient }}
      baseUrl={process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}
    >
      <Container>
        <TabsContainer>
          <Tabs.Content value='configuration'>
            <Heading level='h1' className='text-2xl font-semibold my-10'>
              Hyperswitch Settings
            </Heading>
            <Heading level='h3'>Manage your Hyperswitch settings</Heading>
            <HyperswitchForm />
            <Toaster />
          </Tabs.Content>
          <Tabs.Content value='proxy_confiuguration'>
            <ProxyForm />
            <Toaster />
          </Tabs.Content>
          <Tabs.Content value='customisation'>
            <Customisation />
            <Toaster />
          </Tabs.Content>
          <Tabs.Content value='logs'>
            <Logger />
          </Tabs.Content>
        </TabsContainer>
      </Container>
    </MedusaProvider>
  );
};

export const config: SettingConfig = {
  card: {
    label: 'Hyperswitch Settings',
    description: 'Manage your Hyperswitch settings',
    icon: icons['colored-logo'],
  },
};

export default CustomSettingPage;
