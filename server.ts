import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

// Setup multer memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max per file
    files: 5,
  },
});

const N8N_AGENT_URL = 'https://amruthalakkoju.app.n8n.cloud/form/add20286-bcbd-42fd-aa81-a9eda828c42d';

app.use(express.json());

// API Info endpoint
app.get('/api/agent-info', (_req, res) => {
  res.json({
    status: 'online',
    agentUrl: N8N_AGENT_URL,
    title: 'Medical Report Analyser',
    subtitle: 'Get your medical summary in minutes!',
  });
});

// Submit medical report directly to n8n AI agent
app.post('/api/submit-report', upload.any(), async (req, res) => {
  try {
    const name = (req.body['field-0'] || req.body.name || '').trim();
    const email = (req.body['field-1'] || req.body.email || '').trim();
    const age = (req.body['field-2'] || req.body.age || '').trim();
    const files = (req.files as Express.Multer.File[]) || [];

    if (!name) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (!age || isNaN(Number(age))) {
      return res.status(400).json({ success: false, error: 'A valid age is required.' });
    }
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please upload at least one medical report file.' });
    }

    // Prepare FormData payload for the n8n form webhook
    const formData = new FormData();
    formData.append('field-0', name);
    formData.append('field-1', email);
    formData.append('field-2', age);

    for (const file of files) {
      const blob = new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype || 'application/octet-stream',
      });
      formData.append('field-3', blob, file.originalname || 'medical_report.pdf');
    }

    // Forward to n8n webhook
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

    const n8nRes = await fetch(N8N_AGENT_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const responseText = await n8nRes.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { text: responseText };
    }

    if (n8nRes.ok) {
      return res.json({
        success: true,
        message: 'Your medical report has been successfully submitted to the AI agent.',
        details: {
          patientName: name,
          deliveryEmail: email,
          age,
          filesUploaded: files.map((f) => ({
            name: f.originalname,
            size: f.size,
            type: f.mimetype,
          })),
          n8nStatus: responseData?.status || 200,
        },
      });
    } else {
      return res.status(n8nRes.status).json({
        success: false,
        error: responseData?.message || 'The AI agent workflow returned an error. Please try again.',
        details: responseData,
      });
    }
  } catch (error: any) {
    console.error('Submission error:', error);
    return res.status(500).json({
      success: false,
      error:
        error.name === 'AbortError'
          ? 'The AI agent took too long to respond. The request may still be processing in the background.'
          : error.message || 'An unexpected error occurred while communicating with the AI agent.',
    });
  }
});

// Vite middleware for dev or static serving for production
const startServer = async () => {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Medical Report Analyser server running at http://localhost:${port}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
