
// Back to Top Button Logic
const backToTop = document.getElementById('backToTop');

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

// Accessibility: Add Keyboard Navigation
backToTop.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }
});


    // Hamburger Menu
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu on clicking outside
        document.addEventListener('click', (event) => {
            if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
                navLinks.classList.remove('active');
            }
        });
    }

    // Testimonials Carousel Navigation
const testimonialTrack = document.querySelector('.testimonials-carousel .carousel-track');
const testimonialPrevButton = document.querySelector('.testimonials-carousel .carousel-prev');
const testimonialNextButton = document.querySelector('.testimonials-carousel .carousel-next');

let testimonialIndex = 0;

// Function to update the testimonial carousel position
function updateTestimonialCarousel() {
    const cardWidth = document.querySelector('.testimonial-card').offsetWidth;
    const gap = 15; // Space between cards
    testimonialTrack.style.transform = `translateX(-${(cardWidth + gap) * testimonialIndex}px)`;
}

// Event listeners for navigation buttons
testimonialPrevButton.addEventListener('click', () => {
    if (testimonialIndex > 0) {
        testimonialIndex--;
        updateTestimonialCarousel();
    }
});

testimonialNextButton.addEventListener('click', () => {
    const testimonialCount = document.querySelectorAll('.testimonial-card').length;
    if (testimonialIndex < testimonialCount - 1) {
        testimonialIndex++;
        updateTestimonialCarousel();
    }
});

// Adjust carousel on window resize
window.addEventListener('resize', updateTestimonialCarousel);

    // Get references
const carouselPrev = document.querySelector('.carousel-prev');
const carouselNext = document.querySelector('.carousel-next');
const carouselTrack = document.querySelector('.carousel-track');
const productCards = document.querySelectorAll('.product-card');

// Initialize variables
let currentIndex = 0;

// Carousel Navigation
const track = document.querySelector('.carousel-track');
const prevButton = document.querySelector('.carousel-prev');
const nextButton = document.querySelector('.carousel-next');

let currentIndex = 0;

// Function to update the carousel position
function updateCarousel() {
    const cardWidth = document.querySelector('.product-card').offsetWidth;
    const gap = 15; // Space between cards
    track.style.transform = `translateX(-${(cardWidth + gap) * currentIndex}px)`;
}

// Event listeners for navigation buttons
prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

nextButton.addEventListener('click', () => {
    const cardCount = document.querySelectorAll('.product-card').length;
    if (currentIndex < cardCount - 1) {
        currentIndex++;
        updateCarousel();
    }
});

// Adjust carousel on window resize
window.addEventListener('resize', updateCarousel);


// Add event listeners to arrows
carouselPrev.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

carouselNext.addEventListener('click', () => {
    if (currentIndex < productCards.length - 1) {
        currentIndex++;
        updateCarousel();
    }
});

// Initial setup
window.addEventListener('resize', updateCarousel); // Adjust on window resize
updateCarousel(); // Set initial state


    // Remove Arrows in Hero Section (if any)
    const heroArrows = document.querySelectorAll('.hero button img');
    heroArrows.forEach((arrow) => arrow.remove());
});
