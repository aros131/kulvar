'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import ProfileImageUploader from "@/components/ProfileImageUploader";



interface CoachProfile {
  name: string;
  email: string;
  profilePicture: string;
  specialization?: string;
  role: "coach";
}

const CoachProfilePage = () => {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [editData, setEditData] = useState<CoachProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error("Kullanıcı giriş yapmamış.");
          setLoading(false);
          return;
        }

        const response = await axios.get('https://kulvar-qb7t.onrender.com/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile(response.data);
        setEditData(response.data);
      } catch (err) {
        toast.error("Profil yüklenirken bir hata oluştu.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEditChange = (field: keyof CoachProfile, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !editData) return;
    setUploading(true);
    try {
      const emailSafe = editData.email.replace(/[@.]/g, "_");
      const fileRef = ref(storage, `profile-pictures/${emailSafe}/${uuidv4()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      setEditData(prev => prev ? { ...prev, profilePicture: downloadURL } : null);
      toast.success("Fotoğraf yüklendi.");
    } catch (err) {
      toast.error("Fotoğraf yüklenemedi.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editData) return;
    if (!editData.name.trim()) {
      toast.error("İsim alanı boş bırakılamaz.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token yok');

      const response = await axios.put(
        'https://kulvar-qb7t.onrender.com/profile',
        editData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProfile(response.data);
      setDialogOpen(false);
      toast.success("Profil başarıyla güncellendi.");
    } catch (err) {
      toast.error("Profil güncellenemedi.");
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Profil Bilgileri</h2>

      {loading ? (
        <div className="animate-pulse flex space-x-4 items-center">
          <div className="rounded-full bg-gray-300 h-24 w-24" />
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
      ) : (
        profile && (
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center gap-4">
            <Image
              src={profile.profilePicture || '/images/default-user.jpg'}
              alt="Profil Fotoğrafı"
              width={120}
              height={120}
              className="rounded-full border shadow object-cover w-[120px] h-[120px]"
              unoptimized
            />
            <div className="text-center space-y-2">
              <p className="text-lg"><strong>İsim:</strong> {profile.name}</p>
              <p className="text-gray-700"><strong>Email:</strong> {profile.email}</p>
              <p className="text-gray-700">
                <strong>Branş</strong> {profile.specialization || 'Belirtilmemiş'}
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Profili Düzenle</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Profili Düzenle</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-4">
                  <Input
                    placeholder="İsim"
                    value={editData?.name || ''}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                  />
                  <Input
                    placeholder="Branş"
                    value={editData?.specialization || ''}
                    onChange={(e) => handleEditChange("specialization", e.target.value)}
                  />

                  <ProfileImageUploader onCropped={handleImageUpload} />

                  {uploading && <p className="text-sm text-gray-500">Yükleniyor...</p>}

                  {editData?.profilePicture && (
                    <Image
                      src={editData.profilePicture}
                      alt="Yeni Profil"
                      width={100}
                      height={100}
                      className="rounded-full object-cover w-[100px] h-[100px]"
                      unoptimized
                    />
                  )}
                </div>

                <DialogFooter className="mt-4">
                  <Button onClick={handleSave} disabled={uploading}>
                    Kaydet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )
      )}
    </div>
  );
};

export default CoachProfilePage;
