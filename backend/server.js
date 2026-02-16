import { createServer } from 'node:http';
import { extractInvoicesFromText } from './extractor.js';
import { extractTextFromPdfBuffer } from './pdfTextExtractor.js';

const PORT = Number.parseInt(process.env.PORT || '4000', 10);

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
};

const collectBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    return sendJson(res, 400, { error: 'Invalid request.' });
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'POST' && req.url === '/api/extract') {
    try {
      const raw = await collectBody(req);
      const payload = JSON.parse(raw || '{}');
      const files = Array.isArray(payload.files) ? payload.files : [];

      if (files.length === 0) {
        return sendJson(res, 400, { error: 'No PDF files provided.' });
      }

      const data = [];
      for (const item of files) {
        if (!item?.name || !item?.base64) continue;
        const pdfBuffer = Buffer.from(item.base64, 'base64');
        const extractedText = extractTextFromPdfBuffer(pdfBuffer);
        const extracted = extractInvoicesFromText(extractedText, item.name);
        data.push(...extracted);
      }

      return sendJson(res, 200, { data });
    } catch (error) {
      console.error(error);
      return sendJson(res, 500, { error: 'Unable to extract PDF data on backend.' });
    }
  }

  return sendJson(res, 404, { error: 'Route not found.' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
