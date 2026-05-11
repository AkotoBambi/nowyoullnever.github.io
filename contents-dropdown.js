const menu = document.querySelector('.contents-menu');
const groups = Array.from(document.querySelectorAll('.contents-group'));

function openList(group) {
  const list = group.querySelector('.contents-list');

  group.classList.add('is-open');

  if (list.style.height === 'auto') {
    return;
  }

  list.style.height = `${list.scrollHeight}px`;
}

function closeList(group) {
  const list = group.querySelector('.contents-list');
  const currentHeight = list.scrollHeight;

  list.style.height = `${currentHeight}px`;

  requestAnimationFrame(() => {
    group.classList.remove('is-open');
    list.style.height = '0px';
  });
}

function setupDropdowns() {
  groups.forEach((group) => {
    const list = group.querySelector('.contents-list');

    group.addEventListener('mouseenter', () => {
      openList(group);
    });

    group.addEventListener('mouseleave', () => {
      closeList(group);
    });

    list.addEventListener('transitionend', (event) => {
      if (event.propertyName !== 'height') {
        return;
      }

      if (group.classList.contains('is-open')) {
        list.style.height = 'auto';
      }
    });
  });
}

function setupDvdMotion() {
  if (!menu || groups.length === 0) {
    return;
  }

  const movers = groups.map((group, index) => ({
    group,
    x: 80 + index * 360,
    y: 30 + index * 90,
    vx: (0.39 + Math.random() * 0.24) * (Math.random() > 0.5 ? 1 : -1),
    vy: (0.30 + Math.random() * 0.24) * (Math.random() > 0.5 ? 1 : -1),
  }));

  function placeInsideBounds(mover) {
    const bounds = menu.getBoundingClientRect();
    const rect = mover.group.getBoundingClientRect();
    const maxX = Math.max(0, bounds.width - rect.width);
    const maxY = Math.max(0, bounds.height - rect.height);

    mover.x = Math.min(Math.max(mover.x, 0), maxX);
    mover.y = Math.min(Math.max(mover.y, 0), maxY);
    mover.group.style.transform = `translate3d(${mover.x}px, ${mover.y}px, 0)`;
  }

  movers.forEach(placeInsideBounds);

  function animate() {
    const bounds = menu.getBoundingClientRect();

    movers.forEach((mover) => {
      const rect = mover.group.getBoundingClientRect();
      const maxX = Math.max(0, bounds.width - rect.width);
      const maxY = Math.max(0, bounds.height - rect.height);

      mover.x += mover.vx;
      mover.y += mover.vy;

      if (mover.x <= 0 || mover.x >= maxX) {
        mover.vx *= -1;
        mover.x = Math.min(Math.max(mover.x, 0), maxX);
      }

      if (mover.y <= 0 || mover.y >= maxY) {
        mover.vy *= -1;
        mover.y = Math.min(Math.max(mover.y, 0), maxY);
      }

      mover.group.style.transform = `translate3d(${mover.x}px, ${mover.y}px, 0)`;
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    movers.forEach(placeInsideBounds);
  });

  requestAnimationFrame(animate);
}

setupDropdowns();
setupDvdMotion();
