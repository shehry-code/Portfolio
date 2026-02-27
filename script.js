/* ============================================================
   CYBER WORLD PORTFOLIO — script.js
   Author : Shehry
   Purpose: Three.js 3D hero, scroll animations, form handling,
            background particles, nav scrolled state, mobile nav
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// UTILITY: wait for DOM to be ready
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHeroScene();       // Three.js 3D world
  initBgParticles();     // Full-page background particle canvas
  initScrollAnimations();// Fade-in on scroll + skill bars
  initNav();             // Navbar scroll state + mobile menu
  initContactForm();     // Formspree + success message
});


/* ============================================================
   1. THREE.JS HERO SCENE
   Creates a 3D cyber world with:
   - Floating cubes
   - Wireframe spheres
   - Particle field
   - Slow camera drift
   - Scroll-based parallax
============================================================ */
function initHeroScene() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true          // transparent bg — CSS gradient shows through
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap at 2× for perf
  renderer.setClearColor(0x000000, 0);                          // fully transparent

  // --- Scene & Camera ---
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  camera.position.set(0, 0, 18);

  // --- Resize handler ---
  function resize() {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (canvas.width !== W || canvas.height !== H) {
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
  }

  // --- Colors ---
  const CYAN   = new THREE.Color(0x00f5ff);
  const PURPLE = new THREE.Color(0x9b5de5);

  // ── FLOATING CUBES ──────────────────────────────────────────
  const cubeGroup = new THREE.Group();
  const cubeCount = 18;
  const cubeMeshes = [];

  for (let i = 0; i < cubeCount; i++) {
    const size = 0.25 + Math.random() * 0.55;
    const geo  = new THREE.BoxGeometry(size, size, size);
    // Alternate between wireframe and solid
    const mat  = (i % 3 === 0)
      ? new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, opacity: 0.6, transparent: true })
      : new THREE.MeshBasicMaterial({ color: PURPLE, wireframe: true, opacity: 0.3, transparent: true });

    const cube = new THREE.Mesh(geo, mat);
    // Spread cubes across a wide area
    cube.position.set(
      (Math.random() - 0.5) * 28,
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 20 - 2
    );
    // Random initial rotation
    cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    // Store per-cube animation data
    cubeMeshes.push({
      mesh  : cube,
      speed : 0.0003 + Math.random() * 0.0005, // rotation speed
      floatA: Math.random() * Math.PI * 2,      // phase offset for vertical float
      floatS: 0.0008 + Math.random() * 0.0006  // float speed
    });

    cubeGroup.add(cube);
  }

  scene.add(cubeGroup);

  // ── WIREFRAME SPHERES ────────────────────────────────────────
  const sphereGroup = new THREE.Group();
  const sphereCount = 8;
  const sphereMeshes = [];

  for (let i = 0; i < sphereCount; i++) {
    const r   = 0.4 + Math.random() * 0.8;
    const geo = new THREE.SphereGeometry(r, 8, 8); // low poly for perf
    const mat = new THREE.MeshBasicMaterial({
      color      : (i % 2 === 0) ? CYAN : PURPLE,
      wireframe  : true,
      opacity    : 0.25 + Math.random() * 0.2,
      transparent: true
    });

    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.set(
      (Math.random() - 0.5) * 26,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 18 - 4
    );

    sphereMeshes.push({
      mesh  : sphere,
      speed : 0.0002 + Math.random() * 0.0003,
      floatA: Math.random() * Math.PI * 2,
      floatS: 0.0006 + Math.random() * 0.0004
    });

    sphereGroup.add(sphere);
  }

  scene.add(sphereGroup);

  // ── PARTICLE FIELD ───────────────────────────────────────────
  const particleCount = 300;
  const positions = new Float32Array(particleCount * 3); // x,y,z for each

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 50; // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 30; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40; // z
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color      : CYAN,
    size       : 0.06,
    transparent: true,
    opacity    : 0.55,
    sizeAttenuation: true   // particles shrink with distance
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── CAMERA DRIFT STATE ───────────────────────────────────────
  // We store target positions and lerp smoothly toward them.
  const camBase  = { x: 0, y: 0, z: 18 };       // resting position
  let camTarget  = { x: 0, y: 0 };               // drifts gently
  let camCurrent = { x: 0, y: 0 };               // smoothed value

  // Scroll parallax state
  let scrollY = 0;

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  // Gentle camera oscillation timer
  let driftT = 0;

  // ── ANIMATION LOOP ───────────────────────────────────────────
  let clock = 0;  // manual clock in seconds

  function animate() {
    requestAnimationFrame(animate);
    resize();

    // Increment clock by a fixed tiny amount (independent of frame rate at ~60fps)
    clock += 0.016;
    driftT += 0.003;

    // ── Rotate + float each cube
    cubeMeshes.forEach(({ mesh, speed, floatA, floatS }) => {
      mesh.rotation.x += speed;
      mesh.rotation.y += speed * 1.3;
      mesh.position.y += Math.sin(clock + floatA) * floatS;
    });

    // ── Rotate + float each sphere
    sphereMeshes.forEach(({ mesh, speed, floatA, floatS }) => {
      mesh.rotation.x += speed * 0.7;
      mesh.rotation.y += speed;
      mesh.position.y += Math.sin(clock + floatA) * floatS;
    });

    // ── Slowly rotate particle cloud
    particles.rotation.y += 0.00015;
    particles.rotation.x += 0.00008;

    // ── Camera drift — lazy sine wave
    camTarget.x = Math.sin(driftT * 0.6) * 1.2;
    camTarget.y = Math.cos(driftT * 0.4) * 0.6;

    // Lerp current toward target (smooth damp)
    camCurrent.x += (camTarget.x - camCurrent.x) * 0.02;
    camCurrent.y += (camTarget.y - camCurrent.y) * 0.02;

    camera.position.x = camBase.x + camCurrent.x;
    camera.position.y = camBase.y + camCurrent.y;

    // ── Scroll parallax: push scene slightly as user scrolls
    const parallax = scrollY * 0.003;
    cubeGroup.position.z  = parallax * 0.8;
    sphereGroup.position.z = parallax * 0.4;
    particles.position.z   = parallax * 1.2;

    renderer.render(scene, camera);
  }

  animate();

  // ── Fade in hero text once scene is running ──────────────────
  setTimeout(() => {
    const heroText = document.getElementById('heroText');
    if (heroText) heroText.classList.add('visible');
  }, 400);
}


/* ============================================================
   2. BACKGROUND PARTICLES (full-page canvas, fixed behind all)
   Lightweight 2D canvas — small glowing dots floating gently.
============================================================ */
function initBgParticles() {
  // Create canvas and append to body (behind everything via CSS z-index)
  const canvas = document.createElement('canvas');
  canvas.id    = 'bgCanvas';
  document.body.prepend(canvas);

  const ctx   = canvas.getContext('2d');
  const count = 80; // keep it light
  let   W, H;
  const dots = [];

  // Build dot objects
  function buildDots() {
    dots.length = 0;
    for (let i = 0; i < count; i++) {
      dots.push({
        x    : Math.random() * W,
        y    : Math.random() * H,
        r    : 0.5 + Math.random() * 1.5,
        vx   : (Math.random() - 0.5) * 0.25,
        vy   : (Math.random() - 0.5) * 0.25,
        alpha: 0.1 + Math.random() * 0.4
      });
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', () => { resize(); buildDots(); });
  resize();
  buildDots();

  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);

    dots.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;

      // Wrap around edges
      if (d.x < -10) d.x = W + 10;
      if (d.x > W + 10) d.x = -10;
      if (d.y < -10) d.y = H + 10;
      if (d.y > H + 10) d.y = -10;

      // Draw dot with a soft glow
      const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 4);
      grad.addColorStop(0, `rgba(0,245,255,${d.alpha})`);
      grad.addColorStop(1, 'rgba(0,245,255,0)');

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });
  }

  draw();
}


/* ============================================================
   3. SCROLL ANIMATIONS
   - IntersectionObserver triggers .fade-in → .visible
   - Also starts skill bar fill animation when skills section
     enters the viewport
============================================================ */
function initScrollAnimations() {

  // ── Fade-in elements ────────────────────────────────────────
  const fadeEls = document.querySelectorAll('.fade-in');

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Optionally stop observing after it's revealed
        fadeObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,   // trigger when 15% is visible
    rootMargin: '0px 0px -40px 0px'
  });

  fadeEls.forEach(el => fadeObserver.observe(el));

  // ── Skill bar fill ───────────────────────────────────────────
  // When the skills section comes into view, animate the fill bars
  const skillsSection = document.getElementById('skills');
  if (!skillsSection) return;

  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Small delay so fade-in completes first
        setTimeout(() => {
          document.querySelectorAll('.skill-fill').forEach(bar => {
            bar.style.width = bar.style.getPropertyValue('--w') || '70%';
          });
        }, 300);
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  skillObserver.observe(skillsSection);
}


/* ============================================================
   4. NAVBAR
   - Adds .scrolled class when user scrolls past hero
   - Handles mobile hamburger toggle
============================================================ */
function initNav() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  // ── Scroll state ─────────────────────────────────────────────
  function onScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // ── Mobile menu toggle ───────────────────────────────────────
  let menuOpen = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
    mobileNav.classList.toggle('open', menuOpen);
    document.body.style.overflow = menuOpen ? 'hidden' : '';

    // Animate hamburger → X
    const spans = hamburger.querySelectorAll('span');
    if (menuOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity   = '';
      spans[2].style.transform = '';
    }
  }

  hamburger.addEventListener('click', toggleMenu);

  // Close menu when a mobile link is clicked
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (menuOpen) toggleMenu();
    });
  });
}


/* ============================================================
   5. CONTACT FORM
   Intercepts form submit, posts to Formspree via fetch,
   then shows success message.
============================================================ */
function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form || !success) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // stop default navigation

    const btn  = form.querySelector('.submit-btn');
    const text = btn.querySelector('.btn-text');

    // Visual loading state
    btn.disabled   = true;
    text.textContent = 'Sending...';

    try {
      const data     = new FormData(form);
      const response = await fetch(form.action, {
        method : 'POST',
        body   : data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        // Hide form, show success
        form.style.display    = 'none';
        success.removeAttribute('hidden');
      } else {
        // Re-enable on error
        btn.disabled     = false;
        text.textContent = 'Try Again';
        alert('Something went wrong. Please try again.');
      }
    } catch (err) {
      btn.disabled     = false;
      text.textContent = 'Try Again';
      alert('Network error. Please check your connection.');
    }
  });
}
