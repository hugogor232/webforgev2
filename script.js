/*
 * WebForge AI - Global UI Logic
 * Handles navigation, animations, toasts, and general UI interactions.
 * Note: Authentication logic is handled in auth-oauth.js
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initFormValidation();
    initStickyHeader();
});

/* =========================================
   1. MOBILE MENU
   ========================================= */
function initMobileMenu() {
    const burgerBtn = document.querySelector('.burger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuLinks = document.querySelectorAll('.mobile-menu a');

    if (burgerBtn && mobileMenu) {
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu.classList.contains('active') && 
                !mobileMenu.contains(e.target) && 
                !burgerBtn.contains(e.target)) {
                closeMenu();
            }
        });

        // Close menu when clicking a link
        menuLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    function toggleMenu() {
        const isOpen = mobileMenu.classList.contains('active');
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    function openMenu() {
        mobileMenu.classList.add('active');
        burgerBtn.classList.add('open'); // Optional: for burger icon animation
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeMenu() {
        mobileMenu.classList.remove('active');
        burgerBtn.classList.remove('open');
        document.body.style.overflow = '';
    }
}

/* =========================================
   2. SMOOTH SCROLL
   ========================================= */
function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');

    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();
                
                // Account for fixed header
                const headerOffset = 80; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* =========================================
   3. SCROLL ANIMATIONS (Intersection Observer)
   ========================================= */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.card, .hero-text, .hero-visual, .step-item, .section-header');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('slide-up');
                entry.target.style.opacity = '1'; // Ensure visibility
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        // Set initial state for animation
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

/* =========================================
   4. STICKY HEADER
   ========================================= */
function initStickyHeader() {
    const header = document.querySelector('.site-header');
    let lastScroll = 0;

    if (header) {
        window.addEventListener('scroll', throttle(() => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 50) {
                header.style.background = 'rgba(15, 23, 42, 0.95)';
                header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.background = 'rgba(15, 23, 42, 0.8)';
                header.style.boxShadow = 'none';
            }

            lastScroll = currentScroll;
        }, 100));
    }
}

/* =========================================
   5. FORM VALIDATION (UI Feedback)
   ========================================= */
function initFormValidation() {
    const inputs = document.querySelectorAll('input[required], textarea[required]');

    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateInput(input);
        });

        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateInput(input);
            }
        });
    });
}

function validateInput(input) {
    let isValid = true;
    
    if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(input.value);
    } else {
        isValid = input.value.trim() !== '';
    }

    if (!isValid) {
        input.classList.add('error');
        input.style.borderColor = '#ef4444';
    } else {
        input.classList.remove('error');
        input.style.borderColor = ''; // Reset to CSS default
    }

    return isValid;
}

/* =========================================
   6. TOAST NOTIFICATIONS SYSTEM
   ========================================= */
// Global function to be used by other scripts
window.showToast = function(message, type = 'info') {
    // Create container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    
    // Styles based on type
    let bg, icon;
    switch(type) {
        case 'success':
            bg = 'rgba(34, 197, 94, 0.9)';
            icon = '<i class="fa-solid fa-check-circle"></i>';
            break;
        case 'error':
            bg = 'rgba(239, 68, 68, 0.9)';
            icon = '<i class="fa-solid fa-circle-exclamation"></i>';
            break;
        case 'warning':
            bg = 'rgba(234, 179, 8, 0.9)';
            icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
            break;
        default:
            bg = 'rgba(30, 41, 59, 0.9)';
            icon = '<i class="fa-solid fa-info-circle"></i>';
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    toast.style.cssText = `
        background: ${bg};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
        min-width: 250px;
        backdrop-filter: blur(4px);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        cursor: pointer;
    `;

    // Add to container
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    // Auto remove
    const removeToast = () => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };

    const timer = setTimeout(removeToast, 5000);

    // Click to dismiss
    toast.addEventListener('click', () => {
        clearTimeout(timer);
        removeToast();
    });
};

/* =========================================
   7. UTILITIES
   ========================================= */

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Debounce function for input events
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}

// Format Date Helper
window.formatDate = function(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Format Number Helper
window.formatNumber = function(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}