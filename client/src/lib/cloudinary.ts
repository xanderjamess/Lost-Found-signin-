const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export function uploadImageToCloudinary(
  base64Data: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!base64Data) {
      reject(new Error("Cannot upload empty image data"));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/api/upload-image`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    if (xhr.upload && onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve(response.secure_url);
          } else {
            reject(new Error("Could not retrieve secure URL from server response"));
          }
        } catch {
          reject(new Error("Failed to parse server upload response."));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          reject(new Error(response.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during file upload transfer."));
    xhr.send(JSON.stringify({ image: base64Data }));
  });
}