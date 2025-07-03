// components/program/ProgramMedia.tsx

import React from "react";

interface Video {
  name: string;
  url: string;
  description?: string;
}

interface PDF {
  name: string;
  url: string;
  description?: string;
}

interface ProgramMediaProps {
  videos: Video[];
  pdfs: PDF[];
}

const ProgramMedia: React.FC<ProgramMediaProps> = ({ videos, pdfs }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 mb-4">
      <h2 className="text-lg font-semibold mb-2">Program Medyası</h2>

      <div className="mb-4">
        <h3 className="font-medium">Videolar</h3>
        {videos.length === 0 ? (
          <p>Video bulunamadı.</p>
        ) : (
          videos.map((video, index) => (
            <div key={index} className="mb-2">
              <p className="font-bold">{video.name}</p>
              <p className="text-sm">{video.description}</p>
              {video.url.includes("youtube.com") ? (
                <iframe
                  src={video.url.replace("watch?v=", "embed/")}
                  className="w-full h-64 mt-2 rounded"
                  allowFullScreen
                />
              ) : (
                <video src={video.url} controls className="w-full mt-2 rounded" />
              )}
            </div>
          ))
        )}
      </div>

      <div>
        <h3 className="font-medium">PDF Dosyaları</h3>
        {pdfs.length === 0 ? (
          <p>PDF bulunamadı.</p>
        ) : (
          pdfs.map((pdf, index) => (
            <div key={index} className="mb-2">
              <p className="font-bold">{pdf.name}</p>
              <p className="text-sm">{pdf.description}</p>
              <a
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                PDF&apos;yi Görüntüle

              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProgramMedia;
