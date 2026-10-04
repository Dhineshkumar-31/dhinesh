"use client";

import React, { useState, useEffect, useId } from "react";
import { PlusCircle, X, Check } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface SelectWithAddValueProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | DropdownOption)[];
  storageKey?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  addModalTitle?: string;
}

const ADD_CUSTOM_FLAG = "__ADD_CUSTOM_VALUE_OPTION__";

export default function SelectWithAddValue({
  id,
  name,
  value,
  onChange,
  options,
  storageKey,
  className = "",
  disabled = false,
  required = false,
  placeholder,
  addModalTitle = "Add Custom Value",
}: SelectWithAddValueProps) {
  const autoId = useId();
  const selectId = id || autoId;

  // Normalized base options
  const baseOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  // Custom options state
  const [customOptions, setCustomOptions] = useState<DropdownOption[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  // Load custom options from localStorage if storageKey is provided
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(`buildledger_custom_opt_${storageKey}`);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomOptions(parsed.map((item) => ({ value: item, label: item })));
        }
      }
    } catch (e) {
      console.error("Failed to load custom dropdown options", e);
    }
  }, [storageKey]);

  // Combine base options + custom options (ensuring no duplicates with base)
  const combinedOptions: DropdownOption[] = [...baseOptions];
  for (const cust of customOptions) {
    if (!combinedOptions.some((o) => o.value.toLowerCase() === cust.value.toLowerCase())) {
      combinedOptions.push(cust);
    }
  }

  // If current value is not in options, temporarily include it so it displays correctly
  if (value && !combinedOptions.some((o) => o.value === value) && value !== ADD_CUSTOM_FLAG) {
    combinedOptions.push({ value, label: value });
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === ADD_CUSTOM_FLAG) {
      setCustomInputValue("");
      setInputError("");
      setIsModalOpen(true);
    } else {
      onChange(selected);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddSubmit = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = customInputValue.trim();
    if (!trimmed) {
      setInputError("Please enter a non-empty value");
      return;
    }

    // Add to custom options
    const newOption: DropdownOption = { value: trimmed, label: trimmed };
    const updatedCustom = [...customOptions.filter((o) => o.value !== trimmed), newOption];
    setCustomOptions(updatedCustom);

    // Save to localStorage
    if (storageKey) {
      try {
        localStorage.setItem(
          `buildledger_custom_opt_${storageKey}`,
          JSON.stringify(updatedCustom.map((o) => o.value))
        );
      } catch (err) {
        console.error("Failed to save custom option", err);
      }
    }

    // Immediately select the newly added value
    onChange(trimmed);
    setIsModalOpen(false);
    setCustomInputValue("");
    setInputError("");
  };

  const modalContent = isModalOpen && (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsModalOpen(false);
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm">{addModalTitle}</h3>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsModalOpen(false);
            }}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter New Value
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. Granite, Septic Tank, Contractor..."
              value={customInputValue}
              onChange={(e) => {
                setCustomInputValue(e.target.value);
                if (inputError) setInputError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddSubmit(e);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {inputError && (
              <p className="text-xs text-rose-500 font-medium mt-1">{inputError}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5">
              This custom value will be saved and selected in the dropdown.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddSubmit(e);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Add Value</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={handleSelectChange}
        disabled={disabled}
        required={required}
        className={className}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {combinedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {/* + Add Value must always appear as the last option */}
        <option value={ADD_CUSTOM_FLAG} className="font-semibold text-blue-600 bg-blue-50/50">
          + Add Value
        </option>
      </select>

      {/* Render modal directly or via portal if mounted */}
      {modalContent}
    </>
  );
}
