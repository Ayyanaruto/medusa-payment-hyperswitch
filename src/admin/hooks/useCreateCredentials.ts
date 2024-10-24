import { useAdminCustomPost } from "medusa-react";

export const useCreateCredentials = () => {
    const { mutate, data, isLoading, isSuccess, isError } = useAdminCustomPost(
        "/hyperswitch/settings",
        ["credentials"],
    );
    
    return { mutate, data, isLoading, isSuccess, isError };
    }