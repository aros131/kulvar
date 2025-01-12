
// Scroll to Top Button
document.addEventListener('DOMContentLoaded', () => {
    const backToTop = document.getElementById('backToTop');

    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > window.innerHeight / 2) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        });
    }

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

    // Carousel Navigation
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselPrev = document.querySelector('.carousel-prev');
    const carouselNext = document.querySelector('.carousel-next');
    const productCards = document.querySelectorAll('.product-card');
    let carouselIndex = 0;

    if (carouselTrack && carouselPrev && carouselNext && productCards.length > 0) {
        const updateCarousel = () => {
            const slideWidth = productCards[0].offsetWidth;
            const offset = -carouselIndex * slideWidth;
            carouselTrack.style.transform = `translateX(${offset}px)`;
        };

        carouselPrev.addEventListener('click', () => {
            if (carouselIndex > 0) {
                carouselIndex--;
                updateCarousel();
            }
        });

        carouselNext.addEventListener('click', () => {
            if (carouselIndex < productCards.length - 1) {
                carouselIndex++;
                updateCarousel();
            }
        });
    }

    // Remove Arrows in Hero Section (if any)
    const heroArrows = document.querySelectorAll('.hero button img');
    heroArrows.forEach((arrow) => arrow.remove());
});
