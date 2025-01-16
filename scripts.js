// Back-to-Top Button Logic
const backToTop = document.getElementById('backToTop');
if (backToTop) {
    // Show/Hide Button on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('show'); // Add 'show' class to make it visible
        } else {
            backToTop.classList.remove('show'); // Remove 'show' class to hide it
        }
    });

    // Smooth Scroll to Top
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    });
}

// Hamburger Menu Logic
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active'); // Toggle menu visibility
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
            navLinks.classList.remove('active');
        }
    });
}

// Testimonials Carousel Logic
const testimonialPrevButton = document.querySelector('.testimonials-carousel-prev');
const testimonialNextButton = document.querySelector('.testimonials-carousel-next');
const testimonialTrack = document.querySelector('.testimonials-carousel-track');
const testimonialCards = document.querySelectorAll('.testimonial-card');
let testimonialIndex = 0;

function updateTestimonialCarousel() {
    if (testimonialTrack) {
        const cardWidth = testimonialCards[0]?.offsetWidth || 0;
        const gap = 15; // Space between cards
        testimonialTrack.style.transform = `translateX(-${(cardWidth + gap) * testimonialIndex}px)`;
    }
}

if (testimonialPrevButton && testimonialNextButton) {
    testimonialPrevButton.addEventListener('click', () => {
        if (testimonialIndex > 0) {
            testimonialIndex--;
            updateTestimonialCarousel();
        }
    });

    testimonialNextButton.addEventListener('click', () => {
        if (testimonialIndex < testimonialCards.length - 1) {
            testimonialIndex++;
            updateTestimonialCarousel();
        }
    });
}

// Initialize Testimonials Carousel
updateTestimonialCarousel();
window.addEventListener('resize', updateTestimonialCarousel);

// Product Categories Carousel Logic
const productPrevButton = document.querySelector('.product-carousel-prev');
const productNextButton = document.querySelector('.product-carousel-next');
const productTrack = document.querySelector('.product-carousel-track');
const productCards = document.querySelectorAll('.product-card');
let productIndex = 0;

function updateProductCarousel() {
    if (productTrack) {
        const cardWidth = productCards[0]?.offsetWidth || 0;
        const gap = 15; // Space between cards
        productTrack.style.transform = `translateX(-${(cardWidth + gap) * productIndex}px)`;
    }
}

if (productPrevButton && productNextButton) {
    productPrevButton.addEventListener('click', () => {
        if (productIndex > 0) {
            productIndex--;
            updateProductCarousel();
        }
    });

    productNextButton.addEventListener('click', () => {
        if (productIndex < productCards.length - 1) {
            productIndex++;
            updateProductCarousel();
        }
    });
}

// Initialize Product Categories Carousel
updateProductCarousel();
window.addEventListener('resize', updateProductCarousel);

// Chat Popup Logic
const chatButton = document.getElementById('chatButton');
const chatPopup = document.getElementById('chatPopup');
if (chatButton && chatPopup) {
    chatButton.addEventListener('click', () => {
        chatPopup.style.display = chatPopup.style.display === 'block' ? 'none' : 'block';
    });
}
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token'); // Replace with your token logic
    const headers = { Authorization: `Bearer ${token}` };
  
    try {
      const response = await fetch('http://localhost:5003/api/user/programs', { headers });
      const data = await response.json();
  
      if (response.ok) {
        const programsSection = document.querySelector('#programs');
        programsSection.innerHTML = data.programs.map(program => `
          <div class="program">
            <h3>${program.name}</h3>
            <ul class="task-list">
              ${program.tasks.map(task => `
                <li>
                  <input type="checkbox" ${task.completed ? 'checked' : ''}>
                  ${task.name}
                </li>
              `).join('')}
            </ul>
            <progress value="${program.progress}" max="100"></progress>
            <p>%${program.progress} Tamamlandı</p>
          </div>
        `).join('');
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
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
  
    fetch(`http://localhost:5003${endpoint}`, { headers })
      .then(response => response.json())
      .then(data => {
        if (response.ok) {
          const container = document.querySelector('#programs');
          container.innerHTML = data.programs.map(program => `
            <div>
              <h3>${program.name}</h3>
              <p>${program.description}</p>
            </div>
          `).join('');
        } else {
          console.error(data.message);
        }
      })
      .catch(err => console.error("Error fetching dashboard data:", err));
  });
  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
  
    try {
      const response = await fetch('http://localhost:5003/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.'); // Registration successful! You can now log in.
        window.location.href = 'login.html';
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
  