"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const ProgramCreatePage = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: "",
    difficulty: "",
    fitnessGoal: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/programs`, form, { withCredentials: true });
      router.push("/dashboard/coach");
    } catch (error) {
      console.error("Program oluşturulurken hata oluştu:", error);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Yeni Program Oluştur</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Program Adı"
          value={form.name}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <textarea
          name="description"
          placeholder="Açıklama"
          value={form.description}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          name="duration"
          placeholder="Süre (ör. 4 hafta)"
          value={form.duration}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="difficulty"
          placeholder="Zorluk Seviyesi (ör. Başlangıç)"
          value={form.difficulty}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="fitnessGoal"
          placeholder="Hedef (ör. Kilo Verme)"
          value={form.fitnessGoal}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Program Oluştur
        </button>
      </form>
    </div>
  );
};

export default ProgramCreatePage;
