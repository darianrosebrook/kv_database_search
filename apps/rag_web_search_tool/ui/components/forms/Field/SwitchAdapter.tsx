/**
 * Switch adapter component for form fields
 */
import React from "react";
import Switch from "../Switch";
import { useFieldControl } from "./useFieldControl";

export interface SwitchAdapterProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SwitchAdapter: React.FC<SwitchAdapterProps> = ({
  name,
  label,
  description,
  required,
  disabled,
  className = "",
}) => {
  const { field, controlProps } = useFieldControl(name, {
    required,
    disabled,
  });

  return (
    <div className={className}>
      {label && (
        <label htmlFor={controlProps.id} className="field-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <Switch
        checked={Boolean(field.value)}
        onChange={(_e: React.ChangeEvent<HTMLInputElement>) =>
          field.setValue(!field.value)
        }
        disabled={controlProps.disabled}
        id={controlProps.id}
        aria-describedby={controlProps["aria-describedby"]}
        aria-invalid={controlProps["aria-invalid"]}
      />
      {description && <div className="field-description">{description}</div>}
    </div>
  );
};

export default SwitchAdapter;
