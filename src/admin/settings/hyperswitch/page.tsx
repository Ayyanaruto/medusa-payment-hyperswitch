'use client';
import { QueryClient } from "@tanstack/react-query";
import { MedusaProvider } from "medusa-react";
import type { SettingConfig } from "@medusajs/admin";
import { Heading,Container,Toaster} from "@medusajs/ui";

import HyperswitchForm  from "../../components/HyperSwitchForm";
import icons from "../../icons";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
const CustomSettingPage = () => {
  return (
    <MedusaProvider
      queryClientProviderProps={{ client: queryClient }}
      baseUrl={process.env.MEDUSA_BACKEND_URL||"http://localhost:9000"}
    >
      <Container>
        <Heading level="h1" className="text-2xl font-semibold">
          Hyperswitch Settings
        </Heading>
        <Heading level="h3">Manage your Hyperswitch settings</Heading>
        <HyperswitchForm />
        <Toaster />
      </Container>
    </MedusaProvider>
  );
};


export const config: SettingConfig = {
  card: {
    label: "Hyperswitch Settings",
    description: "Manage your Hyperswitch settings",
    icon: icons["colored-logo"],
  },
};

export default CustomSettingPage;
