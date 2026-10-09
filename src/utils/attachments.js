// Shared helpers for supplier invoice attachments (PDF/image, stored by the backend).

export const ATTACHMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
export const ATTACHMENT_ACCEPT = ATTACHMENT_TYPES.join(',');
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

// Returns an error message for an unacceptable file, or '' when it is fine.
export function validateAttachmentFile(file) {
  if (!file) return '';
  if (!ATTACHMENT_TYPES.includes(file.type)) return 'Attach a PDF, PNG, JPG, or WEBP file.';
  if (file.size > ATTACHMENT_MAX_BYTES) return 'File must be 5 MB or smaller.';
  return '';
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^;]+;base64,/, ''));
    reader.onerror = () => reject(new Error('Could not read the attached file'));
    reader.readAsDataURL(file);
  });
}

// Shape the API expects: { name, mimeType, data(base64) }, or undefined when no file.
export async function toAttachmentPayload(file) {
  if (!file) return undefined;
  return { name: file.name, mimeType: file.type, data: await readFileAsBase64(file) };
}

export function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Opens a fetched Blob in a new tab. The tab is opened synchronously (before the
// fetch resolves) so browsers do not block it as a popup.
export async function openBlobInNewTab(fetchBlob) {
  const tab = window.open('', '_blank');
  try {
    const blob = await fetchBlob();
    const url = URL.createObjectURL(blob);
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}

// onFileChange / onFileClear handlers for a form whose state has an `attachment` field.
export function attachmentHandlers(setForm, setErrors) {
  return {
    onFileChange(event) {
      const file = event.target.files?.[0] || null;
      const error = validateAttachmentFile(file);
      if (error) event.target.value = '';
      setForm((current) => ({ ...current, attachment: error ? null : file }));
      setErrors((current) => {
        const next = { ...current };
        if (error) next.attachment = error;
        else delete next.attachment;
        return next;
      });
    },
    onFileClear() {
      setForm((current) => ({ ...current, attachment: null }));
      setErrors((current) => {
        if (!current.attachment) return current;
        const next = { ...current };
        delete next.attachment;
        return next;
      });
    },
  };
}
