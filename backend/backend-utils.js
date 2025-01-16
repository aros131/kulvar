document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("Lütfen giriş yapın."); // Please log in.
    window.location.href = '/login.html';
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch data for the appropriate dashboard
  const isCoach = window.location.pathname.includes('/dashboard/coach');
  const endpoint = isCoach ? '/api/coach/programs' : '/api/user/programs';

  try {
    const response = await fetch(`https://kulvar.onrender.com${endpoint}`, { headers });
    const data = await response.json();

    if (response.ok) {
      const container = document.querySelector('#programs');
      container.innerHTML = data.programs.map(program => `
        <div class="program">
          <h3>${program.name}</h3>
          <p>${program.description}</p>
          <progress value="${program.progress}" max="100"></progress>
          <p>%${program.progress} Tamamlandı</p>
        </div>
      `).join('');
    } else {
      console.error(data.message || 'Bir hata oluştu.'); // An error occurred.
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  }
});

// Signup Form Logic
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  try {
    const response = await fetch('https://kulvar.onrender.com/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (response.ok) {
      alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.'); // Registration successful! You can now log in.
      window.location.href = '/login.html';
    } else {
      const errorMessage = document.getElementById('error-message');
      errorMessage.textContent = data.message || 'Kayıt başarısız oldu.'; // Registration failed.
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error('Error during registration:', error);
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.'; // An error occurred. Please try again.
    errorMessage.style.display = 'block';
  }
});
