import { useEffect } from "react";
import { useAdminCustomQuery } from "medusa-react";
import { toast } from "@medusajs/ui";
export const useCustomisation = () => {
  const { data, isLoading, isError } = useAdminCustomQuery(
    "/hyperswitch/customisation",
    ["customisation"]
  );
  console.log(data);
  useEffect(() => {
    if (isError) {
      toast.error("Error", {
        description: "Failed to fetch settings",
      });
    }
  }, [isError]);

  return { data, isLoading };
};
