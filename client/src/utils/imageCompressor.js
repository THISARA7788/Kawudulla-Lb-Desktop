/**
 * Compresses an image file using HTML5 Canvas.
 * Resizes to a maximum width/height of 1024px preserving aspect ratio.
 * Compresses JPEG quality to 70% (0.7).
 * Returns a promise that resolves to a base64 Data URL.
 * Falls back to normal base64 read for non-image files.
 * 
 * @param {File} file 
 * @returns {Promise<string>}
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    // Fall back to normal base64 for non-image files (e.g. PDF)
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_LIMIT = 1024;
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > MAX_LIMIT || height > MAX_LIMIT) {
          if (width > height) {
            height = Math.round((height * MAX_LIMIT) / width);
            width = MAX_LIMIT;
          } else {
            width = Math.round((width * MAX_LIMIT) / height);
            height = MAX_LIMIT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 70% quality (0.7)
        const base64DataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64DataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
