'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Input,
  Label,
  Button,
  Select,
  Switch,
  Textarea,
  Text,
  toast,
} from '@medusajs/ui';
import { Spinner } from '@medusajs/icons';

import { useCredentials } from '../hooks/useCredentials';
import { useCreateCredentials } from '../hooks/useCreateCredentials';
import { validateForm, extractFormData } from '../utils';
import { useHyperswitchForm } from '../hooks/useHyperswitchForm';

const FormField = ({ label, error, children }) => (
  <Container className='col-span-5'>
    <Label id={label}>{label}</Label>
    {children}
    {error && <Text className='text-red-500 text-sm mt-1'>{error}</Text>}
  </Container>
);

const EnvironmentSelect = ({ isEditing, value, onChange, error }) => (
  <Container className='col-span-2'>
    <Label id='environment'>Environment</Label>
    <Select
      disabled={!isEditing}
      name='environment'
      value={value}
      onValueChange={onChange}
    >
      <Select.Trigger>
        <Select.Value placeholder='Select Environment' />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value='sandbox'>Sandbox</Select.Item>
        <Select.Item value='production'>Production</Select.Item>
      </Select.Content>
    </Select>
    {error && <Text className='text-red-500 text-sm mt-1'>{error}</Text>}
  </Container>
);

const CaptureMethodSelect = ({ isEditing, value, onChange, error }) => (
  <Container className='col-span-2'>
    <Label id='capture-method'>Capture Method</Label>
    <Select
      disabled={!isEditing}
      name='capture-method'
      value={value}
      onValueChange={onChange}
    >
      <Select.Trigger>
        <Select.Value placeholder='Select Capture Method' />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value='manual'>Manual</Select.Item>
        <Select.Item value='automatic'>Automatic</Select.Item>
      </Select.Content>
    </Select>
    {error && <Text className='text-red-500 text-sm mt-1'>{error}</Text>}
  </Container>
);

const FormContent = ({ formState, handleChange, isEditing, errors }) => (
  <>
    <FormField label='API Key' error={errors.publishable_key}>
      <Input
        placeholder='Enter your API Key'
        id='publishable-key'
        name='publishable-key'
        onChange={handleChange.publishableKey}
        disabled={!isEditing}
        value={formState.publishable_key}
      />
    </FormField>

    <FormField label='API Secret' error={errors.secret_key}>
      <Input
        placeholder='Enter your API Secret'
        type='password'
        id='secret-key'
        name='api-secret-key'
        onChange={handleChange.secretKey}
        disabled={!isEditing}
        value={formState.secret_key}
      />
    </FormField>

    <FormField
      label='Payment Response Hash Key'
      error={errors.payment_hash_key}
    >
      <Input
        placeholder='Enter your Payment Response Hash Key'
        type='password'
        id='payment-hash-key'
        name='payment-response-hash-key'
        onChange={handleChange.paymentHashKey}
        disabled={!isEditing}
        value={formState.payment_hash_key}
      />
    </FormField>

    <FormField label='Webhook URL' error={errors.webhook_url}>
      <Input
        placeholder='Enter your Webhook URL'
        id='webhook-url'
        name='webhook-url'
        onChange={handleChange.webhookURL}
        disabled={!isEditing}
        value={formState.webhook_url}
      />
    </FormField>

    <EnvironmentSelect
      isEditing={isEditing}
      value={formState.environment}
      onChange={handleChange.environment}
      error={errors.environment}
    />

    <CaptureMethodSelect
      isEditing={isEditing}
      value={formState.capture_method}
      onChange={handleChange.captureMethod}
      error={errors.capture_method}
    />

    <Container className='col-span-1 flex items-center gap-x-2'>
      <Label id='enable'>Save Cards</Label>
      <Switch
        disabled={!isEditing}
        name='enable-save-cards'
        checked={formState.enable_save_cards}
        onCheckedChange={handleChange.enableSaveCards}
      />
    </Container>

    <FormField label='Appearance' error={errors.appearence}>
      <Textarea
        placeholder='Customise Hyperswitch appearance'
        id='appearence'
        name='appearence'
        onChange={handleChange.appearence}
        disabled={!isEditing}
        value={formState.appearence}
      />
    </FormField>
  </>
);

const HyperswitchForm = () => {
  const queryClient = useQueryClient();
  const {
    formState,
    handleChange,
    isEditing,
    setIsEditing,
    errors,
    setErrors,
    formSetters,
  } = useHyperswitchForm();

  const { data, isSuccess, isLoading: isLoadingData } = useCredentials();
  const { mutate: createCredentials, isLoading: isSubmitting } =
    useCreateCredentials();

  useEffect(() => {
    if (isSuccess && data?.credentials) {
      Object.entries(data.credentials).forEach(([key, value]) => {
        const setter = formSetters[`set${key}`];
        if (setter) {
          setter(value || '');
        }
      });
    }
  }, [isSuccess, data]);

  const handleEdit = () => setIsEditing(!isEditing);

  const handleSubmit = async event => {
    event.preventDefault();

    if (!isEditing) {
      handleEdit();
      return;
    }

    if (!validateForm(formState, setErrors)) {
      return;
    }

    try {
      const formData = extractFormData(event.target);
      createCredentials(formData, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['credentials'] });
          setErrors({});
          handleEdit();
          toast.success('Success', {
            description: 'Settings saved successfully',
          });
        },
      });

      setErrors({});
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save settings',
      });
    }
  };

  if (isLoadingData) {
    return (
      <Container className='flex justify-center items-center h-64'>
        <Spinner className='animate-spin' />
      </Container>
    );
  }

  return (
    <form className='grid grid-cols-5 gap-3 mt-6' onSubmit={handleSubmit}>
      <FormContent
        formState={formState}
        handleChange={handleChange}
        isEditing={isEditing}
        errors={errors}
      />

      <div className='col-span-2'>
        <Button variant='primary' disabled={isSubmitting}>
          {isEditing ? (isSubmitting ? 'Saving...' : 'Save Changes') : 'Edit'}
        </Button>
        {isEditing && (
          <Button
            variant='secondary'
            type='reset'
            onClick={handleEdit}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default HyperswitchForm;
