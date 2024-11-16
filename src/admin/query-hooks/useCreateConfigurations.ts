import { useAdminCustomPost } from "medusa-react";

export const useCreateConfigurations = () => {
  const { mutate, data, isLoading, isSuccess, isError } = useAdminCustomPost(
    "/hyperswitch/configuration",
    ["configurations"]
  );

  return { mutate, data, isLoading, isSuccess, isError };
};
