import { Container, Input, Label, Button, Switch, toast } from "@medusajs/ui";
import { useQueryClient } from "@tanstack/react-query";

import { FormField, SelectField, SpinnerPage } from "./re:components";

import { useConfigurations, useCreateConfigurations } from "../query-hooks";

import { useConfigurationForm } from "../utility-hooks";

import { validateConfigForm } from "../utils";

import {
  FormContentProps,
  SelectFieldProps,
} from "../../types/components-types";
import {useMemo } from "react";

const EnvironmentSelect = (props: SelectFieldProps) => (
  <SelectField
    label="Environment"
    options={[
      { value: "sandbox", label: "Sandbox" },
      { value: "production", label: "Production" },
    ]}
    {...props}
  />
);

const CaptureMethodSelect = (props: SelectFieldProps) => (
  <SelectField
    label="Capture Method"
    options={[
      { value: "manual", label: "Manual" },
      { value: "automatic", label: "Automatic" },
    ]}
    {...props}
  />
);

const FormContent = ({
  formState,
  handleChange,
  isEditing,
  errors,
}: FormContentProps) => (
  <>
    <FormField label="API Key" error={errors.publishable_key}>
      <Input
        placeholder="Enter your API Key"
        id="publishable-key"
        name="publishable-key"
        onChange={handleChange.publishableKey}
        disabled={!isEditing}
        value={formState.publishableKey}
      />
    </FormField>

    <FormField label="API Secret" error={errors.secret_key}>
      <Input
        placeholder="Enter your API Secret"
        type="password"
        id="secret-key"
        name="api-secret-key"
        onChange={handleChange.secretKey}
        disabled={!isEditing}
        value={formState.secretKey}
      />
    </FormField>

    <FormField
      label="Payment Response Hash Key"
      error={errors.payment_hash_key}
    >
      <Input
        placeholder="Enter your Payment Response Hash Key"
        type="password"
        id="payment-hash-key"
        name="payment-response-hash-key"
        onChange={handleChange.paymentHashKey}
        disabled={!isEditing}
        value={formState.paymentHashKey}
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
      value={formState.captureMethod}
      onChange={handleChange.captureMethod}
      error={errors.capture_method}
    />

    <Container className="col-span-1 flex items-center gap-x-2">
      <Label id="enable">Save Cards</Label>
      <Switch
        disabled={!isEditing}
        name="enable-save-cards"
        checked={formState.enableSaveCards}
        onCheckedChange={handleChange.enableSaveCards}
      />
    </Container>
  </>
);

const ConfigurationForm = () => {
  const queryClient = useQueryClient();
  const {
    formState,
    formSetters,
    handleChange,
    isEditing,
    setIsEditing,
    setErrors,
    errors,
  } = useConfigurationForm();
  const { data, isSuccess, isLoading: isLoadingData } = useConfigurations();
  const { mutate: createConfigurations, isLoading: isSubmitting } =
    useCreateConfigurations();

      useMemo(() => {
        if (isSuccess && data?.configurations) {
          Object.entries(data.configurations).forEach(([key, value]) => {
            const setter = (formSetters as any)[
              `set${key.charAt(0).toUpperCase() + key.slice(1)}`
            ];
            if (setter) {
             if(key === "enableSaveCards"){
               setter(value || false);
                return;
              }
              setter(value || "");
            }
          });
        }
      }, [isSuccess, data]);
  const handleEdit = () => setIsEditing(!isEditing);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isEditing) {
      handleEdit();
      return;
    }

    if (!validateConfigForm(formState, setErrors)) {
      return;
    }
    createConfigurations(formState, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["configurations"] });
        toast.success("Success", {
          description: "Configuration saved successfully",
        });
        handleEdit();
      },
      onError(error, _variables, _context) {
        toast.error("Error", {
          description: error.message,
        });
      },
    });
  };

if(isLoadingData){
  return <SpinnerPage />;
}
  return (
    <form className="grid grid-cols-5 gap-3 mt-6" onSubmit={handleSubmit}>
      <FormContent
        formState={formState}
        handleChange={handleChange}
        isEditing={isEditing}
        errors={errors}
      />
      <div className="col-span-2">
        <Button variant="primary" disabled={isSubmitting}>
          {isEditing ? (isSubmitting ? "Saving..." : "Save Changes") : "Edit"}
        </Button>
        {isEditing && (
          <Button
            variant="secondary"
            type="reset"
            onClick={handleEdit}
            disabled={isSubmitting}
            className="ml-2"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default ConfigurationForm;
