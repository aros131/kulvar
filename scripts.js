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
