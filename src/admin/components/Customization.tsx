'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Label,
  Button,
  Select,
  Textarea,
  Text,
  toast,
  Toaster,
} from '@medusajs/ui';
import { Spinner } from '@medusajs/icons';
import { useCustomisation } from '../hooks/useCustomisation';
import { useCreateCustomisation } from '../hooks/useCreateCustomisation';
import HyperswitchPaymentButton from './HyperswitchAppearenceTest';

const FormField = ({ label, error, children, span = 5 }) => (
  <Container className={`col-span-${span}`}>
    <Label id={label}>{label}</Label>
    {children}
    {error && <Text className='text-red-500 text-sm mt-1'>{error}</Text>}
  </Container>
);

export default function Customisation() {
  const { data, isSuccess, isLoading } = useCustomisation();
  const { mutate, isSuccess: isCreating } = useCreateCustomisation();
  const [appearance, setAppearance] = useState<string>('');
  const [themes, setThemes] = useState<string>('light');
  const [errors, setErrors] = useState<{ appearance?: string }>({});
  const [submittedAppearance, setSubmittedAppearance] = useState<string>('');

  useEffect(() => {
    if (isSuccess && data) {

      setAppearance(data.customisation.appearence);
      setThemes(data.customisation.theme);
      setSubmittedAppearance(JSON.parse(data.customisation.appearence));
    }
  }, [isSuccess, data]);

  const handleChange = {
    themes: (value: string) => setThemes(value),
    appearance: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setAppearance(event.target.value),
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    try {
      const parsedAppearance = JSON.parse(appearance);
      setSubmittedAppearance(parsedAppearance);
      mutate(
        {
          appearance: parsedAppearance,
          theme: themes,
        },
        {
          onSuccess: () => {
            toast.success('Form submitted successfully!');
          },
          onError: () => {
            setErrors({ appearance: 'Invalid JSON format' });
          },
        }
      );
    } catch (e) {
      toast.error('Error', {
        description: 'Failed to submit form',
      });
      setErrors({ appearance: 'Invalid JSON format' });
    }
  };

  if (isLoading) {
    return (
      <Container className='flex justify-center items-center h-screen'>
        <Spinner />
      </Container>
    );
  }


  return (
    <>
      <Container>
        <HyperswitchPaymentButton
          cart={undefined}
          notReady={undefined}
          data-testid={undefined}
          theme={themes}
          styles={submittedAppearance}
        />
      </Container>
      <Container className='grid grid-cols-5 gap-3 mt-6 border-none'>
        <form className='col-span-5' onSubmit={handleSubmit}>
          <FormField label='Themes' span={2} error={''}>
            <Select
              name='themes'
              defaultValue='light'
              onValueChange={handleChange.themes}
              value={themes}
            >
              <Select.Trigger>
                <Select.Value placeholder='Select Theme' />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value='midnight'>Midnight</Select.Item>
                <Select.Item value='light'>Light</Select.Item>
                <Select.Item value='dark'>Dark</Select.Item>
                <Select.Item value='solarized'>Outline</Select.Item>
              </Select.Content>
            </Select>
          </FormField>

          <FormField label='Appearance' span={5} error={errors.appearance}>
            <Textarea
              placeholder='Customise Hyperswitch appearance'
              id='appearance'
              name='appearance'
              value={appearance}
              onChange={handleChange.appearance}
              className='my-4 col-span-5'
            />
          </FormField>
          <div className='col-span-5'>
            <Button type='submit' className='w-full'>
              Save
            </Button>
          </div>
        </form>
        <Toaster />
      </Container>
    </>
  );
}
