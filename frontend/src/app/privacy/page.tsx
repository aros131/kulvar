'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-900 px-4 py-10">
      <section className="max-w-3xl mx-auto prose prose-zinc dark:prose-invert">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground dark:text-white">
          Gizlilik Politikası
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Son güncelleme: Haziran 2025</p>

        <div className="space-y-8 text-zinc-700 dark:text-zinc-300">

          <Section title="1. Toplanan Bilgiler">
            <p>PerSe Coaching platformuna kayıt olduğunuzda aşağıdaki bilgileri toplarız:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Ad ve soyad</li>
              <li>E-posta adresi</li>
              <li>Şifre (şifrelenmiş olarak saklanır, asla düz metin halinde tutulmaz)</li>
              <li>Rol bilgisi (kullanıcı veya koç)</li>
              <li>Fitness hedefleri veya uzmanlık alanı (isteğe bağlı)</li>
              <li>Profil fotoğrafı (yüklenirse)</li>
            </ul>
            <p className="mt-3">Platform kullanımı sırasında ayrıca şunlar toplanabilir:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Koç-danışan mesajlaşmaları (Firebase Firestore)</li>
              <li>Program tamamlama ve antrenman ilerleme verileri</li>
              <li>Randevu ve takvim verileri</li>
            </ul>
          </Section>

          <Section title="2. Bilgilerin Kullanım Amacı">
            <p>Topladığımız bilgileri yalnızca aşağıdaki amaçlarla kullanırız:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Platforma giriş ve kimlik doğrulaması sağlamak</li>
              <li>Koç ve danışan arasında program, mesaj ve randevu bağlantısı kurmak</li>
              <li>Antrenman ilerlemenizi takip etmek ve size göstermek</li>
              <li>Bildirim ve hatırlatmalar göndermek</li>
              <li>Platformun düzgün çalışmasını sağlamak</li>
            </ul>
            <p className="mt-3">Bilgilerinizi üçüncü taraflara satmayız veya reklam amaçlı kullanmayız.</p>
          </Section>

          <Section title="3. Verilerin Saklanması">
            <p>
              Hesap bilgileriniz güvenli bir MongoDB veritabanında saklanır. Şifreler
              bcrypt algoritmasıyla şifrelenerek tutulur — şifrenizi biz göremeyiz.
            </p>
            <p className="mt-2">
              Mesajlaşma verileri Google Firebase Firestore'da saklanır. Profil
              fotoğrafları Firebase Storage'a yüklenir.
            </p>
            <p className="mt-2">
              Verileriniz, hesabınızı silene kadar sistemde tutulur. Hesabınızı
              sildiğinizde MongoDB'deki kayıtlarınız kalıcı olarak silinir.
            </p>
          </Section>

          <Section title="4. Üçüncü Taraf Hizmetler">
            <p>Platform aşağıdaki üçüncü taraf hizmetleri kullanmaktadır:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Google Firebase</strong> — Gerçek zamanlı mesajlaşma ve dosya
                depolama. Firebase Gizlilik Politikası: firebase.google.com/support/privacy
              </li>
              <li>
                <strong>MongoDB</strong> — Kullanıcı ve program verilerinin saklanması.
              </li>
            </ul>
          </Section>

          <Section title="5. Güvenlik">
            <p>
              Verilerinizin güvenliği için JWT tabanlı kimlik doğrulama, şifrelenmiş
              parola saklama ve HTTPS iletişimi kullanılmaktadır. Ancak internet
              üzerinden iletilen hiçbir verinin %100 güvenli olmadığını hatırlatırız.
            </p>
          </Section>

          <Section title="6. Haklarınız">
            <p>Kişisel verilerinizle ilgili aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Erişim:</strong> Hangi verilerinizin tutulduğunu öğrenme
              </li>
              <li>
                <strong>Düzeltme:</strong> Profil sayfanızdan bilgilerinizi güncelleyebilirsiniz
              </li>
              <li>
                <strong>Silme:</strong> Ayarlar sayfasından &quot;Hesabı Sil&quot; seçeneğiyle
                verilerinizi kalıcı olarak silebilirsiniz
              </li>
              <li>
                <strong>İtiraz:</strong> Verilerinizin işlenmesine itiraz etme hakkına
                sahipsiniz
              </li>
            </ul>
          </Section>

          <Section title="7. Çerezler (Cookies)">
            <p>
              Platform şu an yalnızca kimlik doğrulama amacıyla tarayıcı
              localStorage kullanmaktadır. Reklam veya takip çerezi kullanılmamaktadır.
            </p>
          </Section>

          <Section title="8. İletişim">
            <p>
              Gizlilik politikamızla ilgili sorularınız için{' '}
              <Link href="/contact" className="text-indigo-600 hover:underline">
                İletişim
              </Link>{' '}
              sayfamızdan bize ulaşabilirsiniz.
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-6 border-t border-border dark:border-primary/50">
          <Link href="/" className="text-indigo-600 hover:underline text-sm">
            ← Anasayfaya dön
          </Link>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">{title}</h2>
      <div className="text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
