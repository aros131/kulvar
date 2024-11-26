document.addEventListener('DOMContentLoaded', function () {
    const track = document.querySelector('.carousel-track');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    const productCards = document.querySelectorAll('.product-card');

    // Check for null or missing elements
    if (!track || !prevButton || !nextButton || productCards.length === 0) {
        console.error('Carousel elements not found or missing!');
        return;
    }

    // Dynamically calculate card width and visible count
    const cardWidth = productCards[0].offsetWidth + 20; // Card width + margin
    const visibleCards = Math.floor(track.offsetWidth / cardWidth); // Cards visible in the viewport
    let currentIndex = 0;

    // Scroll carousel to the previous cards
    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        }
    });

    // Scroll carousel to the next cards
    nextButton.addEventListener('click', () => {
        if (currentIndex < productCards.length - visibleCards) {
            currentIndex++;
            track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        }
    });
});


