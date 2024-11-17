import { useState, useEffect, FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Container,
  Button,
  Select,
  Textarea,
  toast,
} from "@medusajs/ui";


import {FormField, UnifiedCheckout,SpinnerPage } from "./re:components";

import { useCustomisation,useCreateCustomisation } from "../query-hooks";

import { useCustomizationForm } from "../utility-hooks";

const Customisation = (): JSX.Element => {
const queryClient = useQueryClient();
const [submittedAppearance, setSubmittedAppearance] =
  useState<Record<string, any>>({});

const { formState, formSetters, handleChange, errors, setErrors } = useCustomizationForm();
const { data, isLoading } = useCustomisation();
const { mutate: createCustomisation, isLoading: isSubmitting } = useCreateCustomisation();

const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (formState.theme === "") {
    setErrors({ theme: "Theme is required" });
    return;
  }
  try {
    const parsedStyles = JSON.parse(formState.styles);
    setSubmittedAppearance(parsedStyles);
  } catch (e) {
    setErrors({ styles: "Styles must be in JSON format" });
    return;
  }
  createCustomisation(formState, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey:["customisation"] });
      toast.success("Success",{
        description: "Customisation updated successfully",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to update custom theme",
      }
      );
    },
  }
  );
}

useEffect(() => {
  if (data) {
    formSetters.setTheme(data.customisations.theme);
    formSetters.setStyles(JSON.stringify(data.customisations.styles));
    setSubmittedAppearance(JSON.parse(JSON.stringify(data.customisations.styles)));
  }
}, [data]);

if(isLoading){
  return <SpinnerPage />;
}
  return (
    <>
      <Container>
        <UnifiedCheckout
          data-testid={undefined}
          theme={formState.theme}
          styles={submittedAppearance}
        />
      </Container>
      <Container className="grid grid-cols-5 gap-3 mt-6 border-none">
        <form className="col-span-5" onSubmit={handleSubmit}>
          <FormField label="Themes"  error={errors.theme}>
            <Select
              name="themes"
              defaultValue="light"
              onValueChange={handleChange.theme}
              value={formState.theme}
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

          <FormField label="Appearance" error={errors.styles}>
            <Textarea
              placeholder="Customise Hyperswitch appearance"
              id="styles"
              name="styles"
              value={formState.styles}
              onChange={handleChange.styles}
              className="my-4 col-span-5"
            />
          </FormField>
          <div className="col-span-5">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Container>
    </>
  );
};

export default Customisation;
