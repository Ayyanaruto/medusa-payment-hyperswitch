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
  Text,
  toast,
} from '@medusajs/ui';
import { Spinner } from '@medusajs/icons';

import { useCredentials } from '../hooks/useCredentials';
import { useCreateCredentials } from '../hooks/useCreateCredentials';
import { validateForm, extractFormData } from '../utils';
import { useHyperswitchForm } from '../hooks/useHyperswitchForm';

const SelectField = ({ label, isEditing, value, onChange, error, options }) => (
  <Container className='col-span-2'>
    <Label id={label}>{label}</Label>
    <Select
      disabled={!isEditing}
      name={label.toLowerCase().replace(' ', '-')}
      value={value}
      onValueChange={onChange}
    >
      <Select.Trigger>
        <Select.Value placeholder={`Select ${label}`} />
      </Select.Trigger>
      <Select.Content>
        {options.map(option => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
    {error && <Text className='text-red-500 text-sm mt-1'>{error}</Text>}
  </Container>
);

export default SelectField;