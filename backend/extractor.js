const NUMBER_CAPTURE = '([+-]?[0-9][0-9\\s.,]*)';

const normalizeNumber = (value) => {
  if (!value) return 0;
  const cleaned = value
    .replace(/\s+/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(/,/g, '.');

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractAmount = (text, labels) => {
  for (const label of labels) {
    const regex = new RegExp(`${label}[^\\d+-]*${NUMBER_CAPTURE}`, 'i');
    const match = text.match(regex);
    if (match?.[1]) return normalizeNumber(match[1]);
  }
  return 0;
};

const extractDate = (text) => {
  const match = text.match(/\b(\d{2}[/-]\d{2}[/-]\d{4})\b/);
  return match?.[1] ?? '';
};

const extractReference = (text, fileName) => {
  const match = text.match(/(?:facture|référence|reference|période|periode)\s*[:\-]?\s*([A-Z0-9/_\-.]+)/i);
  if (match?.[1]) return match[1].trim();

  return fileName.replace(/\.pdf$/i, '');
};

const buildInvoice = (blockText, fileName) => ({
  factureReference: extractReference(blockText, fileName),
  date: extractDate(blockText),
  totalRemise: extractAmount(blockText, ['total\\s+remise', 'remise\\s+totale?']),
  totalCommissionsHT: extractAmount(blockText, ['total\\s+commissions?\\s*ht', 'commissions?\\s*ht']),
  totalTVASurCommissions: extractAmount(blockText, ['total\\s+tva\\s+sur\\s+commissions?', 'tva\\s+sur\\s+commissions?']),
  soldeNetRemise: extractAmount(blockText, ['solde\\s+net\\s+remise', 'solde\\s+net']),
  locationTPE: extractAmount(blockText, ['frais\\s+de\\s+location\\s+tpe', 'location\\s+tpe']),
  fileName,
});

const splitInvoiceBlocks = (text) => {
  const marker = /(facture\s*[:\-]?\s*[A-Z0-9/_\-.]+|période\s*[:\-]?\s*\d{2}[/-]\d{2}[/-]\d{4})/gi;
  const indexes = [];

  let match;
  while ((match = marker.exec(text)) !== null) {
    indexes.push(match.index);
  }

  if (indexes.length <= 1) return [text];

  const blocks = [];
  for (let i = 0; i < indexes.length; i++) {
    const start = indexes[i];
    const end = indexes[i + 1] ?? text.length;
    blocks.push(text.slice(start, end));
  }
  return blocks;
};

export const extractInvoicesFromText = (text, fileName) => {
  const blocks = splitInvoiceBlocks(text).map((block) => block.trim()).filter(Boolean);
  const invoices = blocks.map((block) => buildInvoice(block, fileName));

  const filtered = invoices.filter((item) =>
    item.totalRemise ||
    item.totalCommissionsHT ||
    item.totalTVASurCommissions ||
    item.soldeNetRemise ||
    item.locationTPE,
  );

  return filtered.length > 0 ? filtered : [buildInvoice(text, fileName)];
};
