import React from 'react';

export default function AuthField({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icon,
  iconSrc,
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">
        {Icon ? <Icon /> : null}
        {iconSrc ? <img className="input-icon" src={iconSrc} alt="" aria-hidden="true" /> : null}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-label={label}
        />
      </span>
    </label>
  );
}
