import "server-only";

import { ZodError, z } from "zod";

export const readImageUploadRequest = async (
  request: Request
): Promise<{ data: unknown; image?: File }> => {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return { data: await request.json() };
  }

  const formData = await request.formData();
  const rawData = z.string().parse(formData.get("data"));
  const data = z
    .string()
    .transform((value, context) => {
      try {
        return JSON.parse(value);
      } catch {
        context.addIssue({
          code: "custom",
          message: "Dữ liệu JSON không hợp lệ",
        });
        return z.NEVER;
      }
    })
    .parse(rawData);

  const rawImage = formData.get("image");
  if (typeof rawImage === "string") {
    throw new ZodError([
      {
        code: "custom",
        path: ["image"],
        message: "Ảnh tải lên không hợp lệ",
      },
    ]);
  }

  return { data, image: rawImage ?? undefined };
};
