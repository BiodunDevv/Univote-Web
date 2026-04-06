export async function uploadImageToCloudinary(
  file: File,
  folder: string,
  onProgress?: (progress: number) => void,
) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary configuration is missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("cloud_name", cloudName);
  formData.append("folder", folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", uploadUrl);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.min(
        100,
        Math.max(0, Math.round((event.loaded / event.total) * 100)),
      );
      onProgress?.(progress);
    };

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error("Failed to upload image"));
        return;
      }

      try {
        const data = JSON.parse(request.responseText) as { secure_url: string };
        onProgress?.(100);
        resolve(data.secure_url);
      } catch {
        reject(new Error("Failed to parse upload response"));
      }
    };

    request.onerror = () => reject(new Error("Failed to upload image"));
    request.onabort = () => reject(new Error("Image upload was cancelled"));
    request.send(formData);
  });
}
