import { useAdminCustomPost } from "medusa-react";

export const useCreateProxyConfiguration = () => {
  const { mutate, data, isLoading, isSuccess, isError } = useAdminCustomPost(
    "/hyperswitch/proxy",
    ["proxy"]
  );
  return { mutate, data, isLoading, isSuccess, isError };
};
