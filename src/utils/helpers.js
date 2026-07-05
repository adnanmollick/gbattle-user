// Format balance — handles large numbers, never shows minus
export function formatBalance(n) {
  const v = Math.max(0, Number(n) || 0);
  if (v >= 10000000) return (v / 10000000).toFixed(2) + "Cr";
  if (v >= 100000) return (v / 100000).toFixed(2) + "L";
  if (v >= 10000) return (v / 1000).toFixed(1) + "K";
  return v.toLocaleString("en-US", { minimumFractionDigits: v % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

// Full number with commas (for detailed views)
export function fullNumber(n) {
  const v = Math.max(0, Number(n) || 0);
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// Compress image via canvas before upload
export function compressImage(file, maxSize = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        else if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Square crop for avatars
export function compressSquare(file, size = 300, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const FF_MAPS = ["Bermuda", "Purgatory", "Kalahari", "Alpine", "NeXTerra"];
