import nodemailer from 'nodemailer';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  });
}

const FROM = process.env.SMTP_FROM || '"PerSe Coaching" <noreply@persecoaching.com>';

async function send(to, subject, html) {
  const transport = createTransport();
  if (!transport) {
    console.log(`[EMAIL] SMTP not configured — skipping "${subject}" to ${to}`);
    return;
  }
  try {
    await transport.sendMail({ from: FROM, to, subject, html });
    console.log(`[EMAIL] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

export async function sendProgramAssigned({ clientName, clientEmail, coachName, programName }) {
  const subject = `PerSe Coaching — Yeni program: ${programName}`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#10b981">Merhaba ${clientName},</h2>
      <p>Koçun <strong>${coachName}</strong> sana <strong>${programName}</strong> programını atadı.</p>
      <p style="margin:24px 0">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard/user/programs"
           style="background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Programa Git →
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px">PerSe Coaching — kişisel koçluk platformu</p>
    </div>
  `;
  await send(clientEmail, subject, html);
}

export async function sendBookingConfirmed({ clientName, clientEmail, coachName, date, time }) {
  const subject = `PerSe Coaching — Randevu onaylandı`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#10b981">Merhaba ${clientName},</h2>
      <p>Koçun <strong>${coachName}</strong> ile randevun onaylandı.</p>
      <p><strong>Tarih:</strong> ${date}</p>
      <p><strong>Saat:</strong> ${time}</p>
      <p style="margin:24px 0">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard/user"
           style="background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Panele Git →
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px">PerSe Coaching — kişisel koçluk platformu</p>
    </div>
  `;
  await send(clientEmail, subject, html);
}

export async function sendWelcomeEmail({ name, email, role }) {
  const roleLabel = role === 'coach' ? 'koç' : 'üye';
  const dashPath = role === 'coach' ? '/dashboard/coach' : '/dashboard/user';
  const subject = `PerSe Coaching'e hoş geldin, ${name}!`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#10b981">Hoş geldin, ${name}!</h2>
      <p>PerSe Coaching'e ${roleLabel} olarak katıldın. Seni aramızda görmekten mutluluk duyuyoruz.</p>
      <p style="margin:24px 0">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}${dashPath}"
           style="background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Panele Git →
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px">PerSe Coaching — kişisel koçluk platformu</p>
    </div>
  `;
  await send(email, subject, html);
}

export async function sendPasswordResetEmail({ name, email, resetUrl }) {
  const subject = `PerSe Coaching — Şifre sıfırlama`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#10b981">Merhaba ${name},</h2>
      <p>Şifre sıfırlama talebinde bulundun. Aşağıdaki bağlantıya tıklayarak şifreni yenileyebilirsin.</p>
      <p style="margin:24px 0">
        <a href="${resetUrl}"
           style="background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Şifremi Sıfırla →
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px">Bu bağlantı 1 saat geçerlidir. Talepte bulunmadıysan bu e-postayı görmezden gelebilirsin.</p>
      <p style="color:#6b7280;font-size:12px">PerSe Coaching — kişisel koçluk platformu</p>
    </div>
  `;
  await send(email, subject, html);
}

export async function sendBookingReminderEmail({ clientName, clientEmail, coachName, date, time }) {
  const subject = `PerSe Coaching — Yarınki randevunu unutma!`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#10b981">Randevu Hatırlatması</h2>
      <p>Merhaba ${clientName},</p>
      <p><strong>${coachName}</strong> ile yarın bir randevun var.</p>
      <p><strong>Tarih:</strong> ${date}</p>
      <p><strong>Saat:</strong> ${time}</p>
      <p style="margin:24px 0">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard/user"
           style="background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Randevularım →
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px">PerSe Coaching — kişisel koçluk platformu</p>
    </div>
  `;
  await send(clientEmail, subject, html);
}

export async function sendContactFormReceived({ name, email, message }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const subject = `PerSe Coaching — İletişim formu: ${name}`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>Yeni İletişim Mesajı</h2>
      <p><strong>Gönderen:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Mesaj:</strong></p>
      <blockquote style="border-left:3px solid #10b981;padding-left:12px;color:#374151">${message}</blockquote>
    </div>
  `;
  await send(adminEmail, subject, html);
}
