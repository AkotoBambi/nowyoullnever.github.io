const menu = document.querySelector('.contents-menu');
const groups = Array.from(document.querySelectorAll('.contents-group'));
const dvdColors = [
  '#f23030',
  '#f28705',
  '#f2cb05',
  '#267365',
  '#265c73',
  '#7b3ff2',
  '#f23f9c',
];

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

  function changeColor(mover) {
    const title = mover.group.querySelector('.contents-title');
    const currentColor = title.dataset.colorIndex
      ? Number(title.dataset.colorIndex)
      : -1;
    let nextColor = Math.floor(Math.random() * dvdColors.length);

    if (nextColor === currentColor) {
      nextColor = (nextColor + 1) % dvdColors.length;
    }

    title.dataset.colorIndex = String(nextColor);
    title.style.color = dvdColors[nextColor];
  }

  const movers = groups.map((group, index) => ({
    group,
    x: 80 + index * 360,
    y: 30 + index * 90,
    vx: (0.39 + Math.random() * 0.24) * (Math.random() > 0.5 ? 1 : -1),
    vy: (0.30 + Math.random() * 0.24) * (Math.random() > 0.5 ? 1 : -1),
    width: 0,
    height: 0,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    lastDragX: 0,
    lastDragY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
  }));

  function measureMovers() {
    movers.forEach((mover) => {
      const title = mover.group.querySelector('.contents-title');
      const rect = title.getBoundingClientRect();

      mover.width = rect.width;
      mover.height = rect.height;
    });
  }

  function placeInsideBounds(mover) {
    const bounds = menu.getBoundingClientRect();
    const maxX = Math.max(0, bounds.width - mover.width);
    const maxY = Math.max(0, bounds.height - mover.height);

    mover.x = Math.min(Math.max(mover.x, 0), maxX);
    mover.y = Math.min(Math.max(mover.y, 0), maxY);
    mover.group.style.transform = `translate3d(${mover.x}px, ${mover.y}px, 0)`;
  }

  function bounceFromEachOther() {
    for (let i = 0; i < movers.length; i += 1) {
      for (let j = i + 1; j < movers.length; j += 1) {
        const first = movers[i];
        const second = movers[j];

        if (first.isDragging && second.isDragging) {
          continue;
        }

        const firstRight = first.x + first.width;
        const firstBottom = first.y + first.height;
        const secondRight = second.x + second.width;
        const secondBottom = second.y + second.height;
        const overlaps =
          first.x < secondRight &&
          firstRight > second.x &&
          first.y < secondBottom &&
          firstBottom > second.y;

        if (!overlaps) {
          continue;
        }

        if (first.isDragging || second.isDragging) {
          const dragged = first.isDragging ? first : second;
          const hit = first.isDragging ? second : first;
          const draggedCenterX = dragged.x + dragged.width / 2;
          const draggedCenterY = dragged.y + dragged.height / 2;
          const hitCenterX = hit.x + hit.width / 2;
          const hitCenterY = hit.y + hit.height / 2;
          const distanceX = hitCenterX - draggedCenterX || 1;
          const distanceY = hitCenterY - draggedCenterY || 1;
          const distance = Math.hypot(distanceX, distanceY) || 1;
          const force = 3;

          hit.vx = (distanceX / distance) * force;
          hit.vy = (distanceY / distance) * force;
          hit.x += hit.vx * 4;
          hit.y += hit.vy * 4;
          changeColor(hit);
          placeInsideBounds(hit);
          continue;
        }

        const overlapX = Math.min(firstRight - second.x, secondRight - first.x);
        const overlapY = Math.min(firstBottom - second.y, secondBottom - first.y);

        if (overlapX < overlapY) {
          const push = overlapX / 2;

          if (first.x < second.x) {
            first.x -= push;
            second.x += push;
          } else {
            first.x += push;
            second.x -= push;
          }

          const firstVelocity = first.vx;
          first.vx = second.vx;
          second.vx = firstVelocity;
          changeColor(first);
          changeColor(second);
        } else {
          const push = overlapY / 2;

          if (first.y < second.y) {
            first.y -= push;
            second.y += push;
          } else {
            first.y += push;
            second.y -= push;
          }

          const firstVelocity = first.vy;
          first.vy = second.vy;
          second.vy = firstVelocity;
          changeColor(first);
          changeColor(second);
        }
      }
    }
  }

  function setupDragging() {
    movers.forEach((mover) => {
      const title = mover.group.querySelector('.contents-title');

      title.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) {
          return;
        }

        const bounds = menu.getBoundingClientRect();

        mover.isDragging = true;
        mover.dragOffsetX = event.clientX - bounds.left - mover.x;
        mover.dragOffsetY = event.clientY - bounds.top - mover.y;
        mover.lastDragX = mover.x;
        mover.lastDragY = mover.y;
        mover.lastPointerX = event.clientX;
        mover.lastPointerY = event.clientY;
        mover.group.classList.add('is-dragging');
        title.setPointerCapture(event.pointerId);
      });

      title.addEventListener('pointermove', (event) => {
        if (!mover.isDragging) {
          return;
        }

        const bounds = menu.getBoundingClientRect();
        const maxX = Math.max(0, bounds.width - mover.width);
        const maxY = Math.max(0, bounds.height - mover.height);

        mover.lastDragX = mover.x;
        mover.lastDragY = mover.y;
        mover.lastPointerX = event.clientX;
        mover.lastPointerY = event.clientY;
        mover.x = event.clientX - bounds.left - mover.dragOffsetX;
        mover.y = event.clientY - bounds.top - mover.dragOffsetY;
        mover.x = Math.min(Math.max(mover.x, 0), maxX);
        mover.y = Math.min(Math.max(mover.y, 0), maxY);

        placeInsideBounds(mover);
      });

      function endDrag(event) {
        if (!mover.isDragging) {
          return;
        }

        const nextVx = (mover.x - mover.lastDragX) * 0.08;
        const nextVy = (mover.y - mover.lastDragY) * 0.08;

        mover.vx = Math.abs(nextVx) > 0.12 ? nextVx : mover.vx;
        mover.vy = Math.abs(nextVy) > 0.12 ? nextVy : mover.vy;
        mover.isDragging = false;
        mover.group.classList.remove('is-dragging');

        if (title.hasPointerCapture(event.pointerId)) {
          title.releasePointerCapture(event.pointerId);
        }
      }

      title.addEventListener('pointerup', endDrag);
      title.addEventListener('pointercancel', endDrag);
    });
  }

  measureMovers();
  setupDragging();
  movers.forEach(changeColor);
  movers.forEach(placeInsideBounds);

  function animate() {
    const bounds = menu.getBoundingClientRect();

    movers.forEach((mover) => {
      if (mover.isDragging) {
        return;
      }

      const maxX = Math.max(0, bounds.width - mover.width);
      const maxY = Math.max(0, bounds.height - mover.height);

      mover.x += mover.vx;
      mover.y += mover.vy;

      if (mover.x <= 0 || mover.x >= maxX) {
        mover.vx *= -1;
        mover.x = Math.min(Math.max(mover.x, 0), maxX);
        changeColor(mover);
      }

      if (mover.y <= 0 || mover.y >= maxY) {
        mover.vy *= -1;
        mover.y = Math.min(Math.max(mover.y, 0), maxY);
        changeColor(mover);
      }
    });

    bounceFromEachOther();

    movers.forEach((mover) => {
      placeInsideBounds(mover);
      mover.group.style.transform = `translate3d(${mover.x}px, ${mover.y}px, 0)`;
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    measureMovers();
    movers.forEach(placeInsideBounds);
  });

  requestAnimationFrame(animate);
}

setupDropdowns();
setupDvdMotion();
