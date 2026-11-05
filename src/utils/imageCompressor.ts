/**
 * Utilitas Kompresi Gambar Cerdas untuk Google Spreadsheet & Multi-Perangkat
 * Memastikan gambar logo & background muat di batas sel Google Sheets (maks 50.000 karakter)
 * sehingga dapat disinkronkan ke HP, laptop, dan browser lain tanpa error.
 */

export interface CompressionResult {
  dataUrl: string;
  charCount: number;
  approxKb: number;
  width: number;
  height: number;
}

export async function compressImageForSpreadsheet(
  input: string | File,
  maxDimension = 640,
  maxChars = 42000
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleImageLoaded = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        width = 400;
        height = 400;
      }

      // Hitung rasio resolusi agar tidak melebihi maxDimension
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const fallback = typeof input === 'string' ? input : '';
        resolve({
          dataUrl: fallback,
          charCount: fallback.length,
          approxKb: Math.round((fallback.length * 3) / 4 / 1024),
          width,
          height
        });
        return;
      }

      // Latar belakang putih agar PNG transparan tidak menjadi hitam saat dikonversi ke JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Loop kompresi kualitas progresif agar string base64 <= maxChars (42.000)
      let quality = 0.82;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      while (dataUrl.length > maxChars && quality > 0.20) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      // Jika masih melebihi batas (sangat jarang), turunkan resolusi canvas lebih lanjut
      if (dataUrl.length > maxChars) {
        const scale = 0.75;
        const newW = Math.round(width * scale);
        const newH = Math.round(height * scale);
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = newW;
        smallCanvas.height = newH;
        const smallCtx = smallCanvas.getContext('2d');
        if (smallCtx) {
          smallCtx.fillStyle = '#FFFFFF';
          smallCtx.fillRect(0, 0, newW, newH);
          smallCtx.drawImage(canvas, 0, 0, newW, newH);
          dataUrl = smallCanvas.toDataURL('image/jpeg', 0.60);
          width = newW;
          height = newH;
        }
      }

      const charCount = dataUrl.length;
      const approxKb = Math.round((charCount * 3) / 4 / 1024);

      resolve({
        dataUrl,
        charCount,
        approxKb,
        width,
        height
      });
    };

    img.onload = handleImageLoaded;
    img.onerror = (err) => {
      // Jika terjadi error pada pembacaan image
      if (typeof input === 'string' && input.startsWith('data:')) {
        resolve({
          dataUrl: input,
          charCount: input.length,
          approxKb: Math.round((input.length * 3) / 4 / 1024),
          width: 0,
          height: 0
        });
      } else {
        reject(err);
      }
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(input);
    }
  });
}
