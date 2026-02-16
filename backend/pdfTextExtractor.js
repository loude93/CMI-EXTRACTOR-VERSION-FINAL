import { inflateSync } from 'node:zlib';

const decodePdfEscapes = (value) =>
  value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_m, octal) => String.fromCharCode(Number.parseInt(octal, 8)));

const extractLiteralStrings = (textChunk) => {
  const results = [];
  let current = '';
  let depth = 0;
  let escaped = false;

  for (let i = 0; i < textChunk.length; i++) {
    const char = textChunk[i];

    if (escaped) {
      current += `\\${char}`;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '(') {
      if (depth > 0) current += char;
      depth += 1;
      continue;
    }

    if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        results.push(decodePdfEscapes(current));
        current = '';
      } else if (depth > 0) {
        current += char;
      }
      continue;
    }

    if (depth > 0) current += char;
  }

  return results;
};

const extractHexStrings = (textChunk) => {
  const results = [];
  const matches = textChunk.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g);

  for (const match of matches) {
    const hex = (match[1] || '').replace(/\s+/g, '');
    if (!hex) continue;
    const padded = hex.length % 2 === 0 ? hex : `${hex}0`;
    results.push(Buffer.from(padded, 'hex').toString('latin1'));
  }

  return results;
};

const streamToText = (streamBuffer, isFlate) => {
  try {
    const decoded = isFlate ? inflateSync(streamBuffer) : streamBuffer;
    return decoded.toString('latin1');
  } catch {
    return '';
  }
};

export const extractTextFromPdfBuffer = (pdfBuffer) => {
  const pdfRaw = pdfBuffer.toString('latin1');
  const streamRegex = /<<(?:.|\n|\r)*?>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;

  const textChunks = [];
  let match;
  while ((match = streamRegex.exec(pdfRaw)) !== null) {
    const fullMatch = match[0] || '';
    const streamBody = match[1] || '';
    const isFlate = /\/FlateDecode/.test(fullMatch);

    const streamBuffer = Buffer.from(streamBody, 'latin1');
    const content = streamToText(streamBuffer, isFlate);
    if (!content) continue;

    const textSectionMatches = content.matchAll(/BT([\s\S]*?)ET/g);
    for (const section of textSectionMatches) {
      const sectionBody = section[1] || '';
      const literal = extractLiteralStrings(sectionBody);
      const hex = extractHexStrings(sectionBody);
      const merged = [...literal, ...hex].join(' ');
      if (merged.trim()) textChunks.push(merged);
    }
  }

  if (textChunks.length === 0) {
    return pdfRaw;
  }

  return textChunks.join('\n');
};
