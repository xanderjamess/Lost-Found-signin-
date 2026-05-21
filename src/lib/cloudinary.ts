/**
 * Client util to upload compressed base64 images to our cloud service proxy.
 * Implements standard browser XMLHttpRequest to track real-time upload progress.
 */
export function uploadImageToCloudinary(
  base64Data: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic verification of base64 format stability
    if (!base64Data) {
      reject(new Error('Cannot upload empty image data'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-image', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Attach native progress listener if upload channel and hook are valid
    if (xhr.upload && onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
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
            console.error('Invalid server response structure:', response);
            reject(new Error('Could not retrieve secure URL from server response'));
          }
        } catch (e) {
          console.error('Failed to parse upload JSON response:', e);
          reject(new Error('Failed to parse server upload response.'));
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

    xhr.onerror = () => {
      reject(new Error('Network error during file upload transfer.'));
    };

    // Send payload wrapped securely as JSON
    xhr.send(JSON.stringify({ image: base64Data }));
  });
}
