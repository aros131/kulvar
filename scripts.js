// Back to Top Button Logic
const backToTop = document.getElementById('backToTop'); // Use const for fixed references
let currentIndex = 0; // Use let for mutable variables
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
// Accessibility: Add Keyboard Navigation
backToTop.addEventListener('keydown', (event) => {
if (event.key === 'Enter') {
// Hamburger Menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
hamburger.addEventListener('click', () => {
navLinks.classList.toggle('active');
// Close menu on clicking outside
document.addEventListener('click', (event) => {
if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
navLinks.classList.remove('active');
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
// Event listeners for navigation buttons
testimonialPrevButton.addEventListener('click', () => {
if (testimonialIndex > 0) {
testimonialIndex--;
updateTestimonialCarousel();
testimonialNextButton.addEventListener('click', () => {
const testimonialCount = document.querySelectorAll('.testimonial-card').length;
if (testimonialIndex < testimonialCount - 1) {
testimonialIndex++;
// Select carousel elements
const track = document.querySelector('.carousel-track');
const prevButton = document.querySelector('.carousel-prev');
const nextButton = document.querySelector('.carousel-next');
let currentIndex = 0;
// Function to update the carousel position
function updateCarousel() {
const cardWidth = document.querySelector('.product-card').offsetWidth;
const totalScroll = (cardWidth + gap) * currentIndex;
// Move the track to show the correct card
track.style.transform = `translateX(-${totalScroll}px)`;
prevButton.addEventListener('click', () => {
if (currentIndex > 0) {
currentIndex--; // Move to the previous card
updateCarousel();
nextButton.addEventListener('click', () => {
const cardCount = document.querySelectorAll('.product-card').length;
if (currentIndex < cardCount - 1) {
currentIndex++; // Move to the next card
const backToTop = document.getElementById('backToTop');
// Chat Popup Logic
const chatButton = document.getElementById("chatButton");
const chatPopup = document.getElementById("chatPopup");
chatButton.addEventListener("click", () => {
chatPopup.style.display = chatPopup.style.display === "block" ? "none" : "block";
// Carousel Logic
const carouselTrack = document.querySelector('.carousel-track');
const productCards = document.querySelectorAll('.product-card');
const updateCarousel = () => {
const offset = -currentIndex * productCards[0].offsetWidth;
carouselTrack.style.transform = `translateX(${offset}px)`;
};
currentIndex--;
if (currentIndex < productCards.length - 1) {
currentIndex++;
// Initial Setup
// Update carousel on window resize
window.addEventListener('resize', updateCarousel);
// Adjust carousel on window resize
window.addEventListener('resize', updateTestimonialCarousel);
// Get references
const carouselPrev = document.querySelector('.carousel-prev');
const carouselNext = document.querySelector('.carousel-next');
// Initialize variables
// Carousel Navigation
track.style.transform = `translateX(-${(cardWidth + gap) * currentIndex}px)`;
// Add event listeners to arrows
carouselPrev.addEventListener('click', () => {
carouselNext.addEventListener('click', () => {
// Initial setup
window.addEventListener('resize', updateCarousel); // Adjust on window resize
updateCarousel(); // Set initial state
// Remove Arrows in Hero Section (if any)
const heroArrows = document.querySelectorAll('.hero button img');
heroArrows.forEach((arrow) => arrow.remove());
