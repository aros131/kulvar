"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg } from "../lib/cropperUtils";
import { toast } from "sonner";

interface ProfileImageUploaderProps {
  onCropped: (file: File) => void;
}

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({ onCropped }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Sadece resim dosyaları desteklenir.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu 2MB'den küçük olmalı.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "image/*": [] } });

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropped(croppedFile);
      setImageSrc(null);
      toast.success("Kırpma tamamlandı.");
    } catch (error) {
      toast.error("Kırpma işlemi başarısız oldu.");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!imageSrc ? (
        <div
          {...getRootProps()}
          className="border border-dashed rounded-full w-40 h-40 flex items-center justify-center text-sm text-gray-500 cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <input {...getInputProps()} />
          Fotoğrafı sürükleyin veya tıklayın
        </div>
      ) : (
        <div className="relative w-40 h-40 bg-gray-200 rounded-full overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}

      {imageSrc && (
        <>
          <Slider min={1} max={3} step={0.1} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
          <Button variant="secondary" onClick={handleCrop}>
            Kırp ve Yükle
          </Button>
        </>
      )}
    </div>
  );
};

export default ProfileImageUploader;