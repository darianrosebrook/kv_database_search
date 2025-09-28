import React from "react";
import {
  Select,
  SelectProvider,
  SelectTrigger,
  SelectContent,
  SelectOptions,
} from "../Select";
import type { Option } from "../Select/useSelect";
import { useFieldControl } from "./useFieldControl";

export interface SelectAdapterProps {
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectAdapter({
  options,
  placeholder,
  className,
  disabled,
}: SelectAdapterProps) {
  const { controlProps, field } = useFieldControl("select");

  return (
    <SelectProvider
      options={options}
      value={(field.value as string) ?? ""}
      onChange={(opt) =>
        field.setValue(opt ? (Array.isArray(opt) ? opt[0]?.id : opt.id) : "")
      }
    >
      <Select>
        <SelectTrigger
          placeholder={placeholder}
          className={className}
          name={controlProps.name}
          required={controlProps.required}
          aria-describedby={controlProps["aria-describedby"] as string}
          aria-invalid={controlProps["aria-invalid"] as boolean | undefined}
        />
        <SelectContent>
          <SelectOptions />
        </SelectContent>
      </Select>
    </SelectProvider>
  );
}

export default SelectAdapter;
