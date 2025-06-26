// app/koc/page.tsx
import { Suspense } from 'react';
import CoachesPageContent from './pageContent';

export default function CoachesPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <CoachesPageContent />
    </Suspense>
  );
}
