'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Container, Input, Label, Button, Switch, toast } from '@medusajs/ui';
import { Spinner } from '@medusajs/icons';

import FormField from './FormField';
import { useProxyForm } from '../hooks/useHyperswitchForm';
import {useProxy} from '../hooks/useProxy';
import { useCreateProxy } from '../hooks/useCreateProxy';
import { validateProxyForm, extractProxyFormData } from '../utils';

const ProxyForm = () => {
  const { handleChange, formState, setErrors, errors,formSetters } = useProxyForm();
  const { data, isSuccess, isLoading } = useProxy();
  const { mutate} = useCreateProxy();

  useEffect(() => {
    if (isSuccess) {
      formSetters.setProxyHost(data.proxy.host);
      formSetters.setProxyPort(data.proxy.port);
      formSetters.setProxyUsername(data.proxy.username);
      formSetters.setProxyPassword(data.proxy.password);
      formSetters.setProxyUrl(data.proxy.url);
      formSetters.setEnableProxy(data.proxy.enabled);
    }
    
    
    }
  , [isSuccess, data]);
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = extractProxyFormData(event.target);
      if (!validateProxyForm(formState, setErrors)) return;
      await mutate(formState,{
        onSuccess: () => {
          toast.success('Proxy settings saved successfully');
        },
        onError: () => {
          toast.error('Failed to save proxy settings');
        },

      }

      );
      toast.success('Proxy settings saved successfully');
    } catch (error) {
      toast.error('Failed to save proxy settings');
    }
  };
  if (isLoading) {
    return (
      <Container className='flex justify-center items-center h-full '>
        <Spinner className='animate-spin' />
      </Container>
    );
  }

  return (
    <Container className='grid grid-cols-5 gap-3 mt-6'>
      <form className='col-span-5' onSubmit={handleSubmit}>
        <div className='col-span-1 m-5'>
          <Label>Enable Proxy</Label>
          <Switch
            className='ml-3'
            checked={formState.enabled}
            onCheckedChange={(checked) => {
              handleChange.enableProxy(checked);
            }}
            name="enabled"
          />
        </div>
        <FormField label="Proxy Host" error={errors.host}>
          <Input
            placeholder="Enter your Proxy Host"
            id="proxy-host"
            name="host"
            onChange={handleChange.proxyHost}
            disabled={!formState.enabled}
            value={formState.host}

          />
        </FormField>
        <FormField label="Proxy Port" error={errors.port}>
          <Input
            placeholder="Enter your Proxy Port"
            id="proxy-port"
            name="port"
            onChange={handleChange.proxyPort}
            disabled={!formState.enabled}
            value={formState.port}
          />
        </FormField>
        <FormField label="Proxy Username" error={errors.username}>
          <Input
            placeholder="Enter your Proxy Username"
            id="proxy-username"
            name="username"
            onChange={handleChange.proxyUsername}
            disabled={!formState.enabled}
            value={formState.username}
          />
        </FormField>
        <FormField label="Proxy Password" error={errors.password}>
          <Input
            placeholder="Enter your Proxy Password"
            id="proxy-password"
            name="password"
            onChange={handleChange.proxyPassword}
            disabled={!formState.enabled}
            value={formState.password}
          />
        </FormField>
        <FormField label="Proxy URL" error={errors.url}>
          <Input
            placeholder="Enter your Proxy URL"
            id="proxy-url"
            name="url"
            onChange={handleChange.proxyUrl}
            disabled={!formState.enabled}
            value={formState.url}
          />
        </FormField>
        <Button
          type='submit'
          className='col-span-2 my-5'
        >
          Save
        </Button>
      </form>
    </Container>
  );
};

export default ProxyForm;
