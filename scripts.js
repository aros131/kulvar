
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

    // Testimonials Slider
    const testimonials = document.querySelectorAll('.testimonial');
    const testimonialSlider = document.querySelector('.testimonial-slider');
    const prevButton = document.querySelector('.testimonial-prev');
    const nextButton = document.querySelector('.testimonial-next');
    let currentIndex = 0;

    if (testimonialSlider && prevButton && nextButton && testimonials.length > 0) {
        const updateSlider = () => {
            const slideWidth = testimonials[0].offsetWidth;
            const offset = -currentIndex * slideWidth;
            testimonialSlider.style.transform = `translateX(${offset}px)`;
        };

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateSlider();
            }
        });

        nextButton.addEventListener('click', () => {
            if (currentIndex < testimonials.length - 1) {
                currentIndex++;
                updateSlider();
            }
        });
    }

    // Get references
const carouselPrev = document.querySelector('.carousel-prev');
const carouselNext = document.querySelector('.carousel-next');
const carouselTrack = document.querySelector('.carousel-track');
const productCards = document.querySelectorAll('.product-card');

// Initialize variables
let currentIndex = 0;

// Function to update carousel position
function updateCarousel() {
    const cardWidth = productCards[0].offsetWidth; // Get dynamic card width
    const gap = 10; // Adjust for any gaps between cards
    const offset = -currentIndex * (cardWidth + gap);
    carouselTrack.style.transform = `translateX(${offset}px)`;

    // Show/Hide arrows based on position
    carouselPrev.style.display = currentIndex === 0 ? 'none' : 'flex';
    carouselNext.style.display = currentIndex === productCards.length - 1 ? 'none' : 'flex';
}

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
