import { useEffect } from 'react';
import { useAdminCustomQuery } from 'medusa-react';
import { toast } from '@medusajs/ui';

export const useLogger = () => {
  const { data, isSuccess, isLoading, isError } = useAdminCustomQuery(
    '/hyperswitch/logger',
    ['logs'],
  );
  useEffect(() => {
    if (isError) {
      toast.error('Error', {
        description: 'Failed to fetch logs',
      });
    }
  }, [isError]);

  return { data, isSuccess, isLoading };
};
