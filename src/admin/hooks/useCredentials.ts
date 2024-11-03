import { useEffect } from 'react';
import { useAdminCustomQuery } from 'medusa-react';
import { toast } from '@medusajs/ui';
export const useCredentials = () => {
  const { data, isSuccess, isLoading, isError } = useAdminCustomQuery(
    '/hyperswitch/settings',
    ['credentials'],
  );

  useEffect(() => {
    if (isError) {
      toast.error('Error', {
        description: 'Failed to fetch settings',
      });
    }
  }, [isError]);

  return { data, isSuccess, isLoading };
};
