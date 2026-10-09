import React from 'react';
import { ATTACHMENT_ACCEPT, formatFileSize } from '../utils/attachments';

// Optional single-file picker for a supplier invoice (styles live in suppliers.css).
export default function AttachmentPicker({ label, prompt, file, error, onFileChange, onFileClear, disabled }) {
  return (
    <div className="client-field">
      <span>{label}</span>
      {file ? (
        <div className="supply-attachment">
          <span className="supply-attachment__name" title={file.name}>
            {file.name}
          </span>
          <span className="supply-attachment__size">{formatFileSize(file.size)}</span>
          <button type="button" className="supply-attachment__remove" onClick={onFileClear} disabled={disabled}>
            Remove
          </button>
        </div>
      ) : (
        <label className="supply-attachment__drop">
          <input type="file" accept={ATTACHMENT_ACCEPT} onChange={onFileChange} aria-label={label} />
          <span>{prompt}</span>
        </label>
      )}
      {error ? (
        <span className="field-error">{error}</span>
      ) : (
        <span className="field-hint">PDF or image, up to 5 MB. Optional.</span>
      )}
    </div>
  );
}
