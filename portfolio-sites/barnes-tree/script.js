const header = document.querySelector('[data-header]');
const dialog = document.querySelector('[data-service-dialog]');
const quoteForm = document.querySelector('[data-quote-form]');
const hero = document.querySelector('.hero');
const intro = document.querySelector('.intro');
const processSection = document.querySelector('.process');
const processPanel = document.querySelector('.process-panel');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let fellingFrame = null;

const clamp = value => Math.max(0, Math.min(1, value));

const renderFellingScene = () => {
  fellingFrame = null;
  if (!intro) return;

  if (reduceMotion) {
    intro.style.setProperty('--fall-angle', '0deg');
    intro.style.setProperty('--cut-progress', '0');
    intro.style.setProperty('--worker-lean', '0deg');
    intro.style.setProperty('--worker-shift', '0px');
    intro.style.setProperty('--mountain-back-x', '0px');
    intro.style.setProperty('--mountain-back-y', '0px');
    intro.style.setProperty('--mountain-front-x', '0px');
    intro.style.setProperty('--mountain-front-y', '0px');
    intro.style.setProperty('--mist-x', '0px');
    intro.classList.remove('is-cutting');
    return;
  }

  const rect = intro.getBoundingClientRect();
  const sceneProgress = clamp((window.innerHeight * .42 - rect.top) / (rect.height * .95));
  const cutProgress = clamp(sceneProgress / .28);
  const fallProgress = clamp((sceneProgress - .28) / .72);
  const gravityProgress = Math.pow(fallProgress, 2.2);
  const workerLean = 1.8 * cutProgress - 3.7 * Math.pow(fallProgress, .72);
  const workerShift = -4 * Math.pow(fallProgress, .8);

  intro.style.setProperty('--cut-progress', cutProgress.toFixed(3));
  intro.style.setProperty('--fall-angle', `${(gravityProgress * 82).toFixed(2)}deg`);
  intro.style.setProperty('--worker-lean', `${workerLean.toFixed(2)}deg`);
  intro.style.setProperty('--worker-shift', `${workerShift.toFixed(2)}px`);
  intro.style.setProperty('--mountain-back-x', `${((sceneProgress - .5) * -20).toFixed(2)}px`);
  intro.style.setProperty('--mountain-back-y', `${((sceneProgress - .5) * 8).toFixed(2)}px`);
  intro.style.setProperty('--mountain-front-x', `${((sceneProgress - .5) * 31).toFixed(2)}px`);
  intro.style.setProperty('--mountain-front-y', `${((sceneProgress - .5) * 15).toFixed(2)}px`);
  intro.style.setProperty('--mist-x', `${((sceneProgress - .5) * -46).toFixed(2)}px`);
  intro.classList.toggle('is-cutting', sceneProgress > .015 && sceneProgress < .34);

};

const queueFellingScene = () => {
  if (fellingFrame === null) fellingFrame = requestAnimationFrame(renderFellingScene);
};

const services = {
  removal: {
    title: 'Tree removal',
    description: 'When a tree is declining, unsafe, crowding a structure, or no longer right for the property, the plan should protect everything around it.',
    points: ['Site and access review', 'Controlled removal planning', 'Debris and wood options', 'Cleanup discussed before work begins']
  },
  pruning: {
    title: 'Pruning & crown care',
    description: 'Good pruning respects the tree’s natural structure while solving the practical problem—clearance, deadwood, weight, light, or shape.',
    points: ['Dead and damaged limb removal', 'Selective crown thinning', 'Roof and driveway clearance', 'Young tree structural pruning']
  },
  storm: {
    title: 'Storm cleanup',
    description: 'After wind, snow, or ice, a calm assessment helps separate urgent hazards from damage that can be handled methodically.',
    points: ['Fallen limb cleanup', 'Storm-damaged tree assessment', 'Hang-up and hazard identification', 'Property access restoration']
  },
  stump: {
    title: 'Stump grinding',
    description: 'Grinding a stump clears the obstacle, makes mowing easier, and gives the area a clean starting point for whatever comes next.',
    points: ['Depth matched to the next use', 'Surface root consideration', 'Chip and fill options', 'Clean final grade']
  },
  land: {
    title: 'Brush & land clearing',
    description: 'Selective clearing can recover a view, reopen an edge, or make an overgrown part of the property useful again without stripping away its character.',
    points: ['Brush and sapling removal', 'Trail and boundary clearing', 'View opening', 'Debris management']
  },
  landscape: {
    title: 'Landscape care',
    description: 'Tree care and landscape work belong together. Simple, well-chosen improvements can make the whole property feel more intentional.',
    points: ['Small-tree and shrub planting', 'Selective shaping', 'Bed and edge cleanup', 'Seasonal property care']
  }
};

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
  if (!reduceMotion && hero) {
    const progress = Math.min(window.scrollY / Math.max(hero.offsetHeight, 1), 1);
    hero.style.setProperty('--hero-y', String(progress * 42));
  }
  queueFellingScene();
}, { passive: true });

window.addEventListener('resize', queueFellingScene, { passive: true });
queueFellingScene();

if (!reduceMotion && hero) {
  hero.addEventListener('pointermove', event => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * -10;
    hero.style.setProperty('--hero-x', String(x));
  });
  hero.addEventListener('pointerleave', () => hero.style.setProperty('--hero-x', '0'));
}

document.querySelectorAll('[data-service]').forEach(card => {
  card.addEventListener('click', () => {
    const service = services[card.dataset.service];
    dialog.querySelector('[data-dialog-title]').textContent = service.title;
    dialog.querySelector('[data-dialog-description]').textContent = service.description;
    dialog.querySelector('[data-dialog-list]').innerHTML = service.points.map(point => `<li>${point}</li>`).join('');
    dialog.querySelector('[data-dialog-icon]').innerHTML = card.querySelector('.service-icon').innerHTML;
    dialog.showModal();
    document.body.classList.add('dialog-open');
  });
});

dialog.querySelectorAll('[data-dialog-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) dialog.close();
});
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
dialog.querySelector('[data-dialog-quote]').addEventListener('click', () => dialog.close());

document.querySelectorAll('[data-town]').forEach(button => {
  button.addEventListener('click', () => {
    const town = button.dataset.town;
    if (town === 'lyman') {
      button.classList.add('is-active');
      button.setAttribute('aria-pressed', 'true');
      return;
    }

    const active = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!active));
    button.classList.toggle('is-active', !active);
    document.querySelector(`[data-map-town="${town}"]`)?.classList.toggle('is-visible', !active);
    document.querySelector(`[data-route-town="${town}"]`)?.classList.toggle('is-visible', !active);
  });
});

quoteForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = new FormData(quoteForm).get('name').trim();
  quoteForm.querySelector('[data-form-status]').textContent = `Thanks${name ? `, ${name}` : ''}. This demo request is ready to connect to Barnes Tree & Landscape.`;
  quoteForm.reset();
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();
