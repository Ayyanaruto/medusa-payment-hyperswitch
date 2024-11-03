import { useEffect } from 'react';
import { useAdminCustomQuery } from 'medusa-react';
import { toast } from '@medusajs/ui';


export const useLogger = () => {
  // const eventSource = new EventSource('http://localhost:9000/admin/hyperswitch/logger',{
  //   withCredentials: true,
  
  // },);

  // eventSource.onmessage = event => {
  //   const logData = JSON.parse(event.data);
  //   console.log(logData);
  // };

  // eventSource.addEventListener('connected', event => {
  //   console.log('Connected to log stream:', event.data);
  // });

  // eventSource.addEventListener('log', event => {
  //   const logData = JSON.parse(event.data);
  //   // Handle new log entry
  //   console.log(`[${logData.timestamp}] ${logData.file}: ${logData.content}`);
  // });

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