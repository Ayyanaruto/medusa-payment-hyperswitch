import { CredentialsType } from "../../types";
export const extractFormData = (form: HTMLFormElement): CredentialsType => {
  const data = new FormData(form);
  return {
    publishable_key: data.get("publishable-key") as string,
    secret_key: data.get("api-secret-key") as string,
    payment_hash_key: data.get("payment-response-hash-key") as string,
    webhook_url: data.get("webhook-url") as string,
    environment: data.get("environment") as string,
    capture_method: data.get("capture-method") as string,
    enable_save_cards: data.get("enable-save-cards") === "on",
    appearence: data.get("appearence") as string,
  };
};
