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


const BASE_URL = 'https://kulvar.onrender.com';

async function loginUser(email, password) {
    try {
      const response = await fetch('https://kulvar.onrender.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
  
        // Redirect to the dashboard
        window.location.href = data.dashboardUrl;
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('An error occurred while logging in.');
    }
  }
  
  // Attach event listener for login
  document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginUser(email, password);
  });
  
  async function handleSignup(event) {
    event.preventDefault(); // Prevent form reload
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const response = await fetch('https://kulvar.onrender.com/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            window.location.href = 'login.html'; // Redirect to login page
        } else {
            alert(`Hata: ${data.message}`);
        }
    } catch (err) {
        console.error('Kayıt sırasında hata:', err);
        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
}

document.getElementById('signupForm').addEventListener('submit', handleSignup);
