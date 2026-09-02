import { createWorker } from 'tesseract.js';

export interface OcrProgressInfo {
  status: string;
  progress: number; // 0 to 100
}

/**
 * Preprocesses an image via HTML5 canvas for optimal OCR accuracy.
 * Enhances contrast, converts to grayscale, and applies thresholding.
 */
export async function preprocessImageForOcr(
  imageSource: string | File | HTMLImageElement,
  options: {
    contrast?: number; // 1.0 = normal, 1.5 = high contrast
    brightness?: number; // 0 = normal, 20 = brighter
    invert?: boolean;
    binarizeThreshold?: number; // 0 to 255, 0 = disabled
  } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        // Upscale if too small for better OCR
        let width = img.width;
        let height = img.height;
        if (width < 800) {
          const scale = 800 / width;
          width = 800;
          height = height * scale;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const contrast = options.contrast ?? 1.3;
        const brightness = options.brightness ?? 10;
        const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
        const threshold = options.binarizeThreshold ?? 0;

        for (let i = 0; i < data.length; i += 4) {
          // 1. Grayscale
          let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

          // 2. Brightness & Contrast
          gray = factor * (gray - 128) + 128 + brightness;
          gray = Math.max(0, Math.min(255, gray));

          // 3. Optional Invert
          if (options.invert) {
            gray = 255 - gray;
          }

          // 4. Optional Binarization
          if (threshold > 0) {
            gray = gray >= threshold ? 255 : 0;
          }

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(err);

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(imageSource);
    } else if (imageSource instanceof HTMLImageElement) {
      img.src = imageSource.src;
    }
  });
}

/**
 * Recognizes text from an image source using Tesseract.js
 */
export async function extractTextFromImage(
  imageSource: string | File,
  onProgress?: (info: OcrProgressInfo) => void
): Promise<string> {
  try {
    if (onProgress) {
      onProgress({ status: 'Memproses gambar...', progress: 10 });
    }

    const preprocessedDataUrl = await preprocessImageForOcr(imageSource, {
      contrast: 1.2,
      brightness: 10,
    });

    if (onProgress) {
      onProgress({ status: 'Memuat modul OCR Tesseract...', progress: 30 });
    }

    const worker = await createWorker('ind+eng', 1, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          const pct = Math.round(30 + (m.progress || 0) * 65);
          onProgress({
            status: `Membaca karakter... (${Math.round((m.progress || 0) * 100)}%)`,
            progress: pct,
          });
        }
      },
    });

    const ret = await worker.recognize(preprocessedDataUrl);
    await worker.terminate();

    if (onProgress) {
      onProgress({ status: 'Selesai!', progress: 100 });
    }

    let recognized = ret.data.text || '';

    // Post-process cleanup for common OCR noise in jersey lists
    recognized = recognized
      .replace(/[|\{\}\[\]\\]/g, ' ') // replace pipes and brackets with spaces
      .replace(/^[ \t]*[•·▪◦»›\-*~][ \t]*/gm, '') // remove weird OCR bullets
      .replace(/\r?\n\s*\r?\n/g, '\n') // remove empty lines
      .trim();

    return recognized;
  } catch (err: any) {
    console.error('OCR Error:', err);
    throw new Error(err?.message || 'Gagal memproses gambar dengan OCR.');
  }
}
