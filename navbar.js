document.addEventListener('DOMContentLoaded', function () {
    const track = document.querySelector('.carousel-track');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    const productCards = document.querySelectorAll('.product-card');
    const cardWidth = productCards[0].offsetWidth + 20; // Card width + margin
    let currentIndex = 0;

    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentIndex < productCards.length - 3) { // Adjust based on visible cards
            currentIndex++;
            track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        }
    });
});
