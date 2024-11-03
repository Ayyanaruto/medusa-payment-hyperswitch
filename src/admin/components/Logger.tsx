import { useState, useEffect } from 'react';
import { Container, Heading, Command, Badge, Tabs } from '@medusajs/ui';
import { Spinner } from '@medusajs/icons';
import { useLogger } from '../hooks/useLogger';

const LogBadge = ({ logLevel }) => {
  const badgeColors = {
    INFO: 'blue',
    ERROR: 'red',
    WARN: 'orange',
    SUCCESS: 'green',
    DEBUG: 'purple',
  };

  return <Badge color={badgeColors[logLevel]}>{logLevel}</Badge>;
};
const LogsRenderer = ({ logs }) => {
  const logsPerPage = 10;
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const renderLogsForPage = page => {
    const startIndex = (page - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    return logs.slice(startIndex, endIndex).map((log, index) => {
      const logLevel = log.split(' ')[1];
      const timestamp = log.split(' ')[0];
      const message = log.split(' ').slice(2).join(' ');

      const formattedLog = `${timestamp} ${message}`;

      return (
        <Command key={index} className='my-5 overflow-auto'>
          <LogBadge logLevel={logLevel} />
          <code>{formattedLog}</code>
        </Command>
      );
    });
  };

  return (
    <Tabs defaultValue='1'>
      <Tabs.List>
        {Array.from({ length: totalPages }, (_, i) => (
          <Tabs.Trigger key={i + 1} value={(i + 1).toString()}>
            {i + 1}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <div className='mt-2'>
        {Array.from({ length: totalPages }, (_, i) => (
          <Tabs.Content key={i + 1} value={(i + 1).toString()}>
            {renderLogsForPage(i + 1)}
          </Tabs.Content>
        ))}
      </div>
    </Tabs>
  );
};

export const Logger = () => {
  const { data, isSuccess, isLoading } = useLogger();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (isSuccess) {
      setLogs(data.logs);
    }
  }, [isSuccess, data]);

  return (
    <Container>
      <Heading>Logs</Heading>
      {isLoading && <Spinner className='animate-spin' />}
      {isSuccess && <LogsRenderer logs={logs} />}
    </Container>
  );
};
