/* =====================================================
   SHEHRY PORTFOLIO — script.js
   Handles: typing animation, scroll fade-ins,
            sticky nav active link, hamburger menu,
            contact form, learning bar animation
   ===================================================== */

/* ---- Wait for DOM to be ready ---- */
document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================
     1. TYPING ANIMATION
     Cycles through an array of strings in the hero
     ===================================================== */
  const phrases   = ['Cybersecurity Student', 'Linux Learner', 'Low-Level Computing Enthusiast'];
  const typingEl  = document.getElementById('typing-text');
  let phraseIndex = 0;
  let charIndex   = 0;
  let isDeleting  = false;

  function typeLoop() {
    if (!typingEl) return;

    const current = phrases[phraseIndex];

    if (!isDeleting) {
      // Typing forward
      typingEl.textContent = current.slice(0, charIndex + 1);
      charIndex++;

      if (charIndex === current.length) {
        // Pause at full phrase, then start deleting
        isDeleting = true;
        setTimeout(typeLoop, 1600);
        return;
      }
    } else {
      // Deleting
      typingEl.textContent = current.slice(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }

    // Speed: 80ms typing, 50ms deleting
    const speed = isDeleting ? 50 : 80;
    setTimeout(typeLoop, speed);
  }

  typeLoop();


  /* =====================================================
     2. SMOOTH SCROLL for nav links
     ===================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close mobile menu if open
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  });


  /* =====================================================
     3. HAMBURGER MENU TOGGLE (mobile)
     ===================================================== */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close menu when clicking outside
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    }
  });


  /* =====================================================
     4. ACTIVE NAV LINK on scroll (highlight current section)
     ===================================================== */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navItems.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink);
  updateActiveLink(); // run once on load


  /* =====================================================
     5. FADE-IN ANIMATIONS on scroll
     Adds "visible" class when elements enter viewport
     ===================================================== */
  const fadeEls = document.querySelectorAll('.fade-in');

  function checkFadeIns() {
    fadeEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      // Trigger when element is 80px from the bottom of viewport
      if (rect.top < window.innerHeight - 80) {
        el.classList.add('visible');
      }
    });
  }

  window.addEventListener('scroll', checkFadeIns, { passive: true });
  checkFadeIns(); // trigger for elements already visible on load


  /* =====================================================
     6. LEARNING BAR ANIMATION
     Animates progress bars when they scroll into view
     ===================================================== */
  const learningSection = document.getElementById('learning');
  let learningAnimated  = false;

  function animateLearningBars() {
    if (learningAnimated) return;

    if (learningSection) {
      const rect = learningSection.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        // Trigger the CSS transition by setting width inline (already set in HTML)
        // The CSS transition handles it; we just need to ensure the DOM width is applied
        document.querySelectorAll('.learning-fill').forEach(bar => {
          const w = bar.style.width; // e.g. "65%"
          bar.style.width = '0%';
          // Force reflow then set back to animate
          void bar.offsetWidth;
          bar.style.width = w;
        });
        learningAnimated = true;
      }
    }
  }

  window.addEventListener('scroll', animateLearningBars, { passive: true });
  animateLearningBars();


  /* =====================================================
     7. CONTACT FORM — fake submit with success message
     ===================================================== */
  const form        = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault(); // prevent real submission (no backend)

      // Basic validation
      const name    = form.querySelector('#name').value.trim();
      const email   = form.querySelector('#email').value.trim();
      const message = form.querySelector('#message').value.trim();

      if (!name || !email || !message) return;

      // Show success state
      form.reset();
      formSuccess.classList.add('show');

      // Hide success message after 4 seconds
      setTimeout(() => {
        formSuccess.classList.remove('show');
      }, 4000);
    });
  }


  /* =====================================================
     8. NAVBAR SHADOW on scroll
     ===================================================== */
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.1)';
    } else {
      navbar.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)';
    }
  }, { passive: true });

});
