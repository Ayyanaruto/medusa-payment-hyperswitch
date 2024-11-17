import { useState } from "react";

import { CustomizationFormErrors,CustomizationTypes } from "../../types/components-types";

export const useCustomizationForm = () => {
  const [theme, setTheme] = useState<string>("");
  const [styles, setStyles] = useState<string>("{}");
  const [errors, setErrors] = useState<CustomizationFormErrors>({});
  const handleChange = {
    theme: (value:string) =>
      setTheme(value),
    styles: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setStyles(event.target.value),
  };

  return {
    formState: {
      theme,
      styles,
    } as CustomizationTypes,
    formSetters: {
      setTheme,
      setStyles,
    },
    handleChange,
    errors,
    setErrors,
  };
};
