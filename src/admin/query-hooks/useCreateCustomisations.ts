import { useAdminCustomPost } from "medusa-react";

export const useCreateCustomisation = () => {
  const { mutate, data, isLoading, isSuccess, isError } = useAdminCustomPost(
    "/hyperswitch/customisation",
    ["customisation"]
  );

  return { mutate, data, isLoading, isSuccess, isError };
};
