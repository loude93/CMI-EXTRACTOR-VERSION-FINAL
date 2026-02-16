import { ExtractionResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const extractDataFromPdf = async (files: FileList): Promise<ExtractionResult[]> => {
  const payloadFiles: Array<{ name: string; base64: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type !== 'application/pdf') continue;

    payloadFiles.push({
      name: file.name,
      base64: await toBase64(file),
    });
  }

  const response = await fetch(`${API_BASE_URL}/api/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: payloadFiles }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Backend extraction failed');
  }

  const payload = await response.json();
  return payload.data as ExtractionResult[];
};
