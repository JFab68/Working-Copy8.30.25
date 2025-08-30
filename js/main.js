// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    /**
     * Mobile Menu Toggle
     * Toggles the 'is-active' class on the mobile menu and its toggle button.
     */
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('is-active');
            menuToggle.classList.toggle('is-active');
            // Toggle aria-expanded attribute for accessibility
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
        });
    }

    /**
     * Smooth Scrolling for Anchor Links
     * Intercepts clicks on links starting with '#' and smoothly scrolls to the target.
     */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    /**
     * Button Loading State
     * Adds a loading state to buttons on click, preventing double submission
     * and providing user feedback.
     */
    document.querySelectorAll('.btn[href]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Don't interfere with form submits or anchor links
            if (this.closest('form') || this.getAttribute('href').startsWith('#')) {
                return;
            }

            // Prevent the default link navigation to show the loading state
            e.preventDefault();

            const href = this.getAttribute('href');

            this.classList.add('is-loading');
            this.textContent = 'Loading...';

            // Navigate after a short delay to allow the loading state to be visible
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });

    /**
     * Fade-in Animation on Scroll
     * Uses IntersectionObserver to add a 'visible' class to elements
     * when they enter the viewport.
     */
    const fadeInObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => fadeInObserver.observe(el));

    /**
     * Animated Stat Counter
     * Animates numbers from 0 to their target value when they scroll into view.
     */
    const statObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stat = entry.target;
                const target = parseInt(stat.dataset.target, 10);
                stat.classList.add('animate');
                // Animation logic would go here...
                stat.textContent = target.toLocaleString(); // Simplified for example
                observer.unobserve(stat);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number[data-target]').forEach(stat => statObserver.observe(stat));
});