'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
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
import UnifiedCheckout from './UnifiedCheckout';
import FormField from './FormField';

interface CustomisationData {
  customisation: {
    appearance: string;
    theme: string;
  };
}

interface Errors {
  appearance?: string;
}

const Customisation = (): JSX.Element => {
  const { data, isSuccess, isLoading } = useCustomisation();
  const { mutate } = useCreateCustomisation();
  const [appearance, setAppearance] = useState<string>('');
  const [themes, setThemes] = useState<string>('light');
  const [errors, setErrors] = useState<Errors>({});
  const [submittedAppearance, setSubmittedAppearance] = useState<object>({});

  useEffect(() => {
    if (isSuccess && data) {
      initializeCustomisation(data);
    }
  }, [isSuccess, data]);

  const initializeCustomisation = (data: CustomisationData): void => {
    setAppearance(data.customisation.appearance);
    setThemes(data.customisation.theme);
    setSubmittedAppearance(parseJSON(data.customisation.appearance));
  };

  const parseJSON = (jsonString: string): object => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  const handleThemeChange = (value: string): void => setThemes(value);

  const handleAppearanceChange = (event: ChangeEvent<HTMLTextAreaElement>): void =>
    setAppearance(event.target.value);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setErrors({});

    const parsedAppearance = parseJSON(appearance);
    if (Object.keys(parsedAppearance).length === 0) {
      setErrors({ appearance: 'Invalid JSON format' });
      toast.error('Error', {
        description: 'Failed to submit form',
      });
      return;
    }

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
      },
    );
  };

  if (isLoading) {
    return (
      <Container className="flex justify-center items-center h-screen">
        <Spinner />
      </Container>
    );
  }

  return (
    <>
      <Container>
        <UnifiedCheckout
          cart={undefined}
          notReady={undefined}
          data-testid={undefined}
          theme={themes}
          styles={submittedAppearance}
        />
      </Container>
      <Container className="grid grid-cols-5 gap-3 mt-6 border-none">
        <form className="col-span-5" onSubmit={handleSubmit}>
          <FormField label="Themes" span={2} error="">
            <Select
              name="themes"
              defaultValue="light"
              onValueChange={handleThemeChange}
              value={themes}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select Theme" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="midnight">Midnight</Select.Item>
                <Select.Item value="light">Light</Select.Item>
                <Select.Item value="dark">Dark</Select.Item>
                <Select.Item value="solarized">Outline</Select.Item>
              </Select.Content>
            </Select>
          </FormField>

          <FormField label="Appearance" span={5} error={errors.appearance}>
            <Textarea
              placeholder="Customise Hyperswitch appearance"
              id="appearance"
              name="appearance"
              value={appearance}
              onChange={handleAppearanceChange}
              className="my-4 col-span-5"
            />
          </FormField>
          <div className="col-span-5">
            <Button type="submit" className="w-full">
              Save
            </Button>
          </div>
        </form>
        <Toaster />
      </Container>
    </>
  );
};

export default Customisation;
