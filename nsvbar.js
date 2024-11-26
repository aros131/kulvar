// Select the hamburger icon and navigation links
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// Add an event listener to toggle the active class
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});
