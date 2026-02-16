# CMI Extractor (Frontend + Lightweight Backend)

This app uses a **local backend** and is **not connected to Gemini API**.

## Run locally

### 1) Install dependencies
```bash
npm install
```

### 2) Start backend (port 4000)
```bash
npm run server
```

### 3) Start frontend (port 3000)
```bash
npm run dev
```

Optional frontend env:

```bash
VITE_BACKEND_URL=http://localhost:4000
```

## API

- `GET /api/health`
- `POST /api/extract` with JSON body:

```json
{
  "files": [
    { "name": "statement.pdf", "base64": "<base64-pdf>" }
  ]
}
```
