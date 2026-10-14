"use client";

import { useEffect, useState } from "react";
import { App, Button } from "antd";
import { ImagePlus, X } from "lucide-react";

interface ImageFileFieldProps {
  imageUrl?: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

export default function ImageFileField({
  imageUrl,
  file,
  onChange,
}: ImageFileFieldProps) {
  const { message } = App.useApp();
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSelectFile = (selected?: File) => {
    if (!selected) return;

    const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!acceptedTypes.includes(selected.type)) {
      message.error("Chỉ chấp nhận JPG, PNG hoặc WebP");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      message.error("Dung lượng ảnh không vượt quá 5MB");
      return;
    }

    onChange(selected);
  };

  const src = previewUrl || imageUrl;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-[145px] w-[185px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
          {src ? (
            <img
              src={src}
              alt="Xem trước ảnh"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <ImagePlus size={30} />
              <span className="text-xs">Chưa có ảnh</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#16834b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#126a3d]">
            <ImagePlus size={17} />
            Chọn ảnh
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                handleSelectFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>

          {file && (
            <Button
              size="small"
              danger
              icon={<X size={14} />}
              onClick={() => onChange(null)}
            >
              Bỏ ảnh đã chọn
            </Button>
          )}

          <p className="text-xs text-gray-500">JPG, PNG, WebP — tối đa 5MB</p>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Ảnh được upload khi bạn nhấn lưu, không cần tải lên trước.
      </p>
    </div>
  );
}
