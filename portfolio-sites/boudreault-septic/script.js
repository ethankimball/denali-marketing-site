const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.primary-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? 'Close' : 'Menu';
  });

  navigation.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = 'Menu';
  });
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const territory = document.querySelector('.territory');
let scrollFrame = 0;

function syncScrollEffects() {
  scrollFrame = 0;
  const scrollY = window.scrollY;
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  document.body.style.setProperty('--scroll-progress', Math.min(scrollY / maxScroll, 1));
  header?.classList.toggle('is-scrolled', scrollY > 48);

  if (!reducedMotion && hero) {
    hero.style.setProperty('--hero-shift', `${Math.min(scrollY * 0.12, 72)}px`);
  }

  if (!reducedMotion && territory) {
    const rect = territory.getBoundingClientRect();
    const shift = Math.max(-48, Math.min(48, (window.innerHeight - rect.top) * 0.045));
    territory.style.setProperty('--territory-shift', `${shift}px`);
  }
}

function queueScrollEffects() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(syncScrollEffects);
}

window.addEventListener('scroll', queueScrollEffects, { passive: true });
window.addEventListener('resize', queueScrollEffects, { passive: true });
syncScrollEffects();

if (!reducedMotion && 'IntersectionObserver' in window) {
  const motionGroups = [
    ['.proof-item', 'rise', 90],
    ['.services-intro', 'slide-left', 0],
    ['.service-feature', 'wipe', 0],
    ['.service-secondary', 'wipe', 110],
    ['.service-list', 'scale', 190],
    ['.story-photo', 'slide-left', 0],
    ['.story-copy', 'slide-right', 100],
    ['.territory-grid > *', 'rise', 90],
    ['.review-heading', 'slide-left', 0],
    ['.review-card', 'rise', 90],
    ['.discount-grid > *', 'rise', 90],
    ['.content-block', 'rise', 80],
    ['.photo-grid figure', 'wipe', 80],
    ['.diagram-grid figure', 'scale', 90],
    ['.old-tank img', 'wipe', 90],
    ['.timeline-row', 'rise', 110],
    ['.contact-card', 'slide-left', 0],
    ['.contact-form', 'slide-right', 110],
    ['.footer-grid', 'rise', 0]
  ];

  const animated = new Set();
  motionGroups.forEach(([selector, type, stagger]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (animated.has(element)) return;
      animated.add(element);
      element.dataset.motion = type;
      element.style.setProperty('--delay', `${Math.min(index * stagger, 280)}ms`);
    });
  });

  document.querySelectorAll('.reveal').forEach((element) => {
    if (animated.has(element)) return;
    animated.add(element);
    element.dataset.motion = 'rise';
  });

  document.documentElement.classList.add('motion-ready');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

  animated.forEach((element) => observer.observe(element));
}

const townCounter = document.querySelector('[data-count]');
if (townCounter) {
  const target = Number(townCounter.dataset.count || 30);
  const setFinalCount = () => { townCounter.textContent = String(target); };

  if (reducedMotion || !('IntersectionObserver' in window)) {
    setFinalCount();
  } else {
    const counterObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      counterObserver.disconnect();
      const startedAt = performance.now();
      const duration = 3000;

      function updateCount(now) {
        const progress = Math.min((now - startedAt) / duration, 1);
        townCounter.textContent = String(Math.max(1, Math.round(1 + (target - 1) * progress)));
        if (progress < 1) requestAnimationFrame(updateCount);
      }

      requestAnimationFrame(updateCount);
    }, { threshold: 0.7 });
    counterObserver.observe(townCounter);
  }
}

const ambientMotion = document.querySelectorAll('[data-route-motion], [data-schematic-motion]');
if (ambientMotion.length && !reducedMotion) {
  const syncAmbientMotion = () => {
    ambientMotion.forEach((element) => {
      element.classList.toggle('is-running', element.dataset.inView === 'true' && !document.hidden);
    });
  };

  if ('IntersectionObserver' in window) {
    const ambientObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { entry.target.dataset.inView = String(entry.isIntersecting); });
      syncAmbientMotion();
    }, { threshold: 0.15, rootMargin: '8% 0px 8% 0px' });
    ambientMotion.forEach((element) => ambientObserver.observe(element));
  } else {
    ambientMotion.forEach((element) => { element.dataset.inView = 'true'; });
    syncAmbientMotion();
  }

  document.addEventListener('visibilitychange', syncAmbientMotion);
}

const reviewTrack = document.querySelector('[data-review-track]');
const reviewPrevious = document.querySelector('[data-review-prev]');
const reviewNext = document.querySelector('[data-review-next]');

if (reviewTrack && reviewPrevious && reviewNext) {
  function updateReviewControls() {
    const maxScroll = reviewTrack.scrollWidth - reviewTrack.clientWidth;
    reviewPrevious.disabled = reviewTrack.scrollLeft <= 4;
    reviewNext.disabled = reviewTrack.scrollLeft >= maxScroll - 4;
  }

  function moveReviews(direction) {
    const card = reviewTrack.querySelector('.review-card');
    const gap = Number.parseFloat(getComputedStyle(reviewTrack).columnGap) || 18;
    const distance = (card?.getBoundingClientRect().width || reviewTrack.clientWidth * 0.8) + gap;
    reviewTrack.scrollBy({ left: distance * direction, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  reviewPrevious.addEventListener('click', () => moveReviews(-1));
  reviewNext.addEventListener('click', () => moveReviews(1));
  reviewTrack.addEventListener('scroll', updateReviewControls, { passive: true });
  window.addEventListener('resize', updateReviewControls, { passive: true });
  window.addEventListener('load', updateReviewControls, { once: true });
  requestAnimationFrame(updateReviewControls);
}

const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const service = String(data.get('service') || '').trim();
    const message = String(data.get('message') || '').trim();
    const status = contactForm.querySelector('.form-status');

    if (!name || !email || !message) {
      status.textContent = 'Please complete your name, email, and message.';
      status.classList.add('is-visible');
      return;
    }

    status.textContent = 'Opening your email app with the request filled in.';
    status.classList.add('is-visible');
    const subject = encodeURIComponent(`Service request from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\n\n${message}`);
    window.location.href = `mailto:boudreaultseptic@gmail.com?subject=${subject}&body=${body}`;
  });
}
