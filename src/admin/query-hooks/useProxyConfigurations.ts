import { useEffect } from "react";
import { useAdminCustomQuery } from "medusa-react";

import { toast } from "@medusajs/ui";

export const useProxyConfiguration = () => {
  const { data, isSuccess, isLoading, isError } = useAdminCustomQuery(
    "/hyperswitch/proxy ",
    ["proxy"]
  );
  console.log(data);
  useEffect(() => {
    if (isError) {
      toast.error("Error", {
        description: "Failed to fetch proxy configuration",
      });
    }
  }, [isError]);

  return { data, isSuccess, isLoading };
};
