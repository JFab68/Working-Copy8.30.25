// Animation components for counters and scroll effects

class AnimatedCounters {
    constructor() {
        this.counters = document.querySelectorAll('.stat-number');
        this.observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -50px 0px'
        };
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(this.handleIntersection.bind(this), this.observerOptions);
            this.counters.forEach(counter => this.observer.observe(counter));
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                this.animateCounter(entry.target);
                entry.target.classList.add('counted');
            }
        });
    }

    animateCounter(element) {
        const target = parseInt(element.textContent);
        const duration = 2000;
        const start = performance.now();

        const animation = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easedProgress = this.easeOutExpo(progress);
            const currentValue = Math.round(target * easedProgress);
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
}

class ScrollAnimations {
    constructor() {
        this.elements = [];
        this.observer = null;
        this.init();
    }

    init() {
        // Find elements that should be animated - Updated to match actual HTML classes
        const elementsToAnimate = document.querySelectorAll('.card--change, .card--team, .impact-item, .challenge-item, .reform-impact-card, .faq-intro-card, .faq-contact-card, .nationwide-impact-summary, .crisis-card, .harm-reduction-card, .approach-card, .tool-card');
        
        elementsToAnimate.forEach(el => {
            // Ensure consistent initial state
            if (!el.classList.contains('fade-in-up')) {
                el.classList.add('fade-in-up');
            }
            // Remove visible class if it exists to ensure clean initial state
            el.classList.remove('visible');
            this.elements.push(el);
        });

        // Initialize observer after a small delay to ensure DOM is fully ready
        requestAnimationFrame(() => {
            if ('IntersectionObserver' in window) {
                this.setupIntersectionObserver();
            } else {
                // Fallback for older browsers - show all elements
                this.elements.forEach(el => el.classList.add('visible'));
            }
        });
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add visible class to trigger animation
                    entry.target.classList.add('visible');
                    // Stop observing this element once it's animated
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe all elements
        this.elements.forEach(el => {
            if (this.observer) {
                this.observer.observe(el);
            }
        });
    }

    // Clean up method for better memory management
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.elements = [];
    }
}

// Initialize animations with robust DOM ready detection
function initializeAnimations() {
    const counters = new AnimatedCounters();
    const scrollAnimations = new ScrollAnimations();
    
    // Store references for potential cleanup
    if (typeof window !== 'undefined') {
        window.praxisAnimations = {
            counters,
            scrollAnimations
        };
    }
}

// Multiple ways to ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnimations);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    // DOM is already ready, initialize immediately
    initializeAnimations();
}

// Fallback in case DOMContentLoaded doesn't fire
setTimeout(() => {
    if (!window.praxisAnimations) {
        initializeAnimations();
    }
}, 100);