import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function gasProxyPlugin(): Plugin {
  return {
    name: 'gas-proxy',
    configureServer(server) {
      server.middlewares.use('/api/test-gas', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', 'http://localhost:3000');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Parameter url diperlukan' }));
            return;
          }

          let cleanUrl = targetUrl.trim();
          if (/^AKfy[a-zA-Z0-9_-]{20,}$/.test(cleanUrl)) {
            cleanUrl = `https://script.google.com/macros/s/${cleanUrl}/exec`;
          }
          if (cleanUrl.includes('script.google.com/macros/s/')) {
            cleanUrl = cleanUrl.replace(/\/+$/, '');
            if (!cleanUrl.endsWith('/exec') && !cleanUrl.endsWith('/dev')) {
              cleanUrl += '/exec';
            }
          }

          const fetchUrl = cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'action=get_data';
          const upstreamRes = await fetch(fetchUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          const bodyText = await upstreamRes.text();
          let parsedData: any = null;
          try {
            parsedData = JSON.parse(bodyText);
          } catch {
            // Not JSON
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });

          if (parsedData && parsedData.success) {
            res.end(JSON.stringify({
              success: true,
              message: `Koneksi Berhasil! Terhubung dengan Google Apps Script & Spreadsheet (${parsedData.menus ? parsedData.menus.length : 0} menu aktif).`,
              data: parsedData,
              cleanUrl
            }));
            return;
          }

          if (parsedData && !parsedData.success) {
            res.end(JSON.stringify({
              success: false,
              errorCode: 'GAS_API_ERROR',
              message: parsedData.error || 'Google Apps Script merespons gagal. Periksa ID Spreadsheet di Config.gs.',
              cleanUrl
            }));
            return;
          }

          // Inspect HTML error page
          if (bodyText.includes('Script function not found: doGet')) {
            res.end(JSON.stringify({
              success: false,
              errorCode: 'FUNCTION_NOT_FOUND_DOGET',
              message: "Google Apps Script berhasil dihubungi, namun muncul error: 'Script function not found: doGet'. File Code.gs belum ditempel di Apps Script atau Anda belum membuat Deployment Baru setelah menyimpan kode.",
              detail: 'Script function not found: doGet',
              cleanUrl
            }));
            return;
          }

          if (bodyText.includes('Authorization is required') || bodyText.includes('Script requires authorization') || bodyText.includes('Need authorization') || bodyText.includes('izin')) {
            res.end(JSON.stringify({
              success: false,
              errorCode: 'AUTHORIZATION_REQUIRED',
              message: "Script Google Apps Script memerlukan izin akses (Review Permissions). Di editor Apps Script, pilih fungsi setupDatabase() lalu klik Run (Jalankan) dan izinkan (Allow).",
              detail: 'Authorization is required',
              cleanUrl
            }));
            return;
          }

          res.end(JSON.stringify({
            success: false,
            errorCode: 'INVALID_RESPONSE',
            message: 'Server Google merespons tapi mengembalikan halaman HTML alih-alih data JSON. Pastikan kode Code.gs sudah ditempel lengkap dan tersimpan.',
            snippet: bodyText.slice(0, 300),
            cleanUrl
          }));
        } catch (err: any) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            errorCode: 'NETWORK_ERROR',
            message: `Gagal menghubungi Google Apps Script: ${err.message || 'Network error'}`
          }));
        }
      });

      server.middlewares.use('/api/gas-sync', async (req, res) => {
        try {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const targetUrl = parsed.url;
                if (!targetUrl) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'URL target diperlukan' }));
                  return;
                }
                const upstream = await fetch(targetUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify(parsed.data || parsed)
                });
                const text = await upstream.text();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(text);
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
            return;
          }

          // GET handler
          const urlObj = new URL(req.url || '', 'http://localhost:3000');
          const targetUrl = urlObj.searchParams.get('url');
          const action = urlObj.searchParams.get('action') || 'get_data';
          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'URL target diperlukan' }));
            return;
          }
          const fetchUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=' + encodeURIComponent(action);
          const upstream = await fetch(fetchUrl, { method: 'GET', redirect: 'follow' });
          const text = await upstream.text();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(text);
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      // Server-side persistent branding asset storage (survives any browser reload & multi-device visits)
      server.middlewares.use('/api/upload-branding', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { type, dataUrl } = parsed; // type: 'logo' | 'background'
            if (!type || !dataUrl) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'type dan dataUrl diperlukan' }));
              return;
            }

            const uploadsDir = path.resolve(__dirname, 'public/uploads');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Parse base64
            const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            const ext = type === 'logo' ? 'png' : 'jpg';
            const filename = type === 'logo' ? `logo.${ext}` : `bg.${ext}`;
            const filePath = path.join(uploadsDir, filename);

            if (matches && matches[2]) {
              const buffer = Buffer.from(matches[2], 'base64');
              fs.writeFileSync(filePath, buffer);
            }

            // Update branding.json
            const brandingJsonPath = path.join(uploadsDir, 'branding.json');
            let branding: any = {};
            if (fs.existsSync(brandingJsonPath)) {
              try {
                branding = JSON.parse(fs.readFileSync(brandingJsonPath, 'utf-8'));
              } catch {}
            }

            const assetUrl = `/uploads/${filename}?v=${Date.now()}`;
            if (type === 'logo') {
              branding.logo_url = assetUrl;
            } else {
              branding.background_image_url = assetUrl;
            }
            fs.writeFileSync(brandingJsonPath, JSON.stringify(branding, null, 2), 'utf-8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, url: assetUrl, type }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      server.middlewares.use('/api/app-data', async (req, res) => {
        const appDataJsonPath = path.resolve(__dirname, 'public/uploads/app-data.json');
        const uploadsDir = path.resolve(__dirname, 'public/uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              let existing: any = {};
              if (fs.existsSync(appDataJsonPath)) {
                try {
                  existing = JSON.parse(fs.readFileSync(appDataJsonPath, 'utf-8'));
                } catch {}
              }
              const updated = {
                ...existing,
                ...parsed,
                updated_at: new Date().toISOString()
              };
              fs.writeFileSync(appDataJsonPath, JSON.stringify(updated, null, 2), 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Data berhasil disimpan di server' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // GET method
        try {
          if (fs.existsSync(appDataJsonPath)) {
            const content = fs.readFileSync(appDataJsonPath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: JSON.parse(content) }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, data: null }));
        } catch (err: any) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gasProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

