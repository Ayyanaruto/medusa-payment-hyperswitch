"use client";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Heading, Container, Toaster, Tabs } from "@medusajs/ui";
import { QueryClient } from "@tanstack/react-query";
import { MedusaProvider } from "medusa-react";

import { ConfigurationForm } from "../../components";
import { TabsContainer } from "../../components/re:components";
import icons from "../../icons";

const HyperswitchIcon = icons["colored-logo"];
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const HyperswitchPage = () => {
  return (
    <MedusaProvider
      queryClientProviderProps={{ client: queryClient }}
      baseUrl={"http://localhost:9000"}
    >
      <Container>
        <Heading level="h1" className="text-2xl font-semibold">
          Hyperswitch Settings ⚒️
        </Heading>
        <p className="text-lg text-gray-600 mb-6">
          Configure your Hyperswitch settings here.
        </p>
        <TabsContainer>
          <Tabs.Content value="configuration">
            <ConfigurationForm />
            <Toaster />
          </Tabs.Content>
        </TabsContainer>
      </Container>
    </MedusaProvider>
  );
};
export const config = defineRouteConfig({
  label: "Hyperswitch",
  icon: HyperswitchIcon,
});

export default HyperswitchPage;
