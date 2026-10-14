import "server-only";

import cloudinary from "@/libs/cloudinary";

const MAX_SIZE = 5 * 1024 * 1024;

export const uploadImage = async (
  file: File,
  folder: string = "healthybowl"
): Promise<{
  image_url: string;
  public_id: string;
}> => {
  if (file.size === 0 || file.size > MAX_SIZE) {
    throw new Error("Ảnh không được vượt quá 5 MB");
  }

  const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!supportedTypes.includes(file.type)) {
    throw new Error("Chỉ hỗ trợ ảnh JPG, PNG và WebP");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const isPng =
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  const isWebp =
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (
    (file.type === "image/jpeg" && !isJpeg) ||
    (file.type === "image/png" && !isPng) ||
    (file.type === "image/webp" && !isWebp)
  ) {
    throw new Error("Nội dung ảnh không hợp lệ");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload ảnh thất bại"));
          return;
        }

        resolve({
          image_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
};

export const deleteImage = async (publicId: string) => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};
