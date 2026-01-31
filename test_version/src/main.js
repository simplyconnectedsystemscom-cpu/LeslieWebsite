import './style.css'

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Scroll Reveal Animation (Intersection Observer)
const revealElements = document.querySelectorAll('.reveal');

const revealCallback = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      // Optional: Stop observing once revealed
      // observer.unobserve(entry.target);
    }
  });
};

const revealOptions = {
  threshold: 0.15, // Trigger when 15% of element is visible
  rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver(revealCallback, revealOptions);

revealElements.forEach(el => observer.observe(el));

console.log('Leslie Website Loaded');
