/**
 * Text input adapter component for form fields
 */
import React from "react";
import { Input } from "../Input";
import { useFieldControl } from "./useFieldControl";

export interface TextInputAdapterProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder?: string;
  className?: string;
}

export const TextInputAdapter: React.FC<TextInputAdapterProps> = ({
  name,
  label,
  description,
  required,
  disabled,
  type = "text",
  placeholder,
  className = "",
}) => {
  const { field, controlProps } = useFieldControl(name, {
    required,
    disabled,
  });

  return (
    <div className={className}>
      <Input
        type={type}
        value={field.value || ""}
        onChange={(e) => field.setValue(e.target.value)}
        placeholder={placeholder}
        disabled={controlProps.disabled}
        required={controlProps.required}
        id={controlProps.id}
        aria-describedby={controlProps["aria-describedby"]}
        aria-invalid={controlProps["aria-invalid"]}
        label={label}
        helperText={description}
      />
    </div>
  );
};

export default TextInputAdapter;
