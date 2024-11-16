"use client";
import {
  Container,
  Label,
  Select,
  Text,

} from "@medusajs/ui";

;

interface SelectFieldProps {
  label: string;
  isEditing: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: { value: string; label: string }[];
}

const SelectField = ({ label, isEditing, value, onChange, error, options }: SelectFieldProps) => (
  <Container className="col-span-2">
    <Label id={label}>{label}</Label>
    <Select
      disabled={!isEditing}
      name={label.toLowerCase().replace(" ", "-")}
      value={value}
      onValueChange={onChange}
    >
      <Select.Trigger>
        <Select.Value placeholder={`Select ${label}`} />
      </Select.Trigger>
      <Select.Content>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
    {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
  </Container>
);

export default SelectField;
