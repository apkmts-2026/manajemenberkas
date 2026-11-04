import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
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

