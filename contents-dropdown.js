const menu = document.querySelector('.contents-menu');
const groups = Array.from(document.querySelectorAll('.contents-group'));
const bouncingControl = document.querySelector('.bouncing-control');
const accelerationControl = document.querySelector('.acceleration-control');
const dvdColors = [
  '#f23030',
  '#f28705',
  '#f2cb05',
  '#267365',
  '#265c73',
  '#7b3ff2',
  '#f23f9c',
];

function getBaseMenuMinHeight() {
  if (!menu) {
    return 520;
  }

  return window.matchMedia('(max-width: 900px)').matches ? 620 : 520;
}

function openList(group) {
  const list = group.querySelector('.contents-list');

  group.classList.add('is-open');

  if (list.style.height === 'auto') {
    return;
  }

  list.style.height = `${list.scrollHeight}px`;
  updateOpenListSpace();
}

function closeList(group) {
  const list = group.querySelector('.contents-list');
  const currentHeight = list.scrollHeight;

  list.style.height = `${currentHeight}px`;

  requestAnimationFrame(() => {
    group.classList.remove('is-open');
    list.style.height = '0px';
    updateOpenListSpace();
  });
}

function updateOpenListSpace() {
  if (!menu) {
    return;
  }

  const menuRect = menu.getBoundingClientRect();
  const openGroups = Array.from(document.querySelectorAll('.contents-group.is-open'));
  const neededHeight = openGroups.reduce((height, group) => {
    const list = group.querySelector('.contents-list');
    const groupRect = group.getBoundingClientRect();
    const listHeight = list ? list.scrollHeight : 0;
    const bottom = groupRect.top - menuRect.top + groupRect.height + 18 + listHeight + 32;

    return Math.max(height, bottom);
  }, getBaseMenuMinHeight());

  menu.style.minHeight = `${neededHeight}px`;
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

      updateOpenListSpace();
    });
  });
}

function setupDvdMotion() {
  if (!menu || groups.length === 0) {
    return;
  }

  let isBouncing = localStorage.getItem('contentsStartBouncing') === 'true';

  if (bouncingControl) {
    bouncingControl.checked = isBouncing;
  }

  function getAcceleration() {
    return accelerationControl ? Number(accelerationControl.value) : 1;
  }

  function clampVelocity(mover) {
    const maxSpeed = 3.2 * getAcceleration();

    mover.vx = Math.min(Math.max(mover.vx, -maxSpeed), maxSpeed);
    mover.vy = Math.min(Math.max(mover.vy, -maxSpeed), maxSpeed);
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

  function setTitlesBlack() {
    movers.forEach((mover) => {
      const title = mover.group.querySelector('.contents-title');

      title.style.color = 'black';
      delete title.dataset.colorIndex;
    });
  }

  function scheduleColorChange(mover) {
    window.setTimeout(() => {
      if (isBouncing) {
        changeColor(mover);
      }

      scheduleColorChange(mover);
    }, 650 + Math.random() * 950);
  }


  const movers = groups.map((group, index) => ({
    group,
    x: 80 + index * 360,
    y: 30 + index * 90,
    vx: (0.39 + Math.random() * 0.24) * (Math.random() > 0.5 ? 1 : -1),
    vy: (0.30 + Math.random() * 0.24) * (Math.random() > 0.5 ? 1 : -1),
    visualWidth: 0,
    visualHeight: 0,
    hitWidth: 0,
    hitHeight: 0,
    hitOffsetX: 0,
    hitOffsetY: 0,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    lastDragX: 0,
    lastDragY: 0,
  }));

  function getMoverBox(mover) {
    return {
      left: mover.x + mover.hitOffsetX,
      top: mover.y + mover.hitOffsetY,
      right: mover.x + mover.hitOffsetX + mover.hitWidth,
      bottom: mover.y + mover.hitOffsetY + mover.hitHeight,
      width: mover.hitWidth,
      height: mover.hitHeight,
    };
  }

  function measureMovers() {
    movers.forEach((mover) => {
      const title = mover.group.querySelector('.contents-title');
      const rect = title.getBoundingClientRect();

      mover.visualWidth = rect.width;
      mover.visualHeight = rect.height;
      mover.hitWidth = rect.width * 0.7;
      mover.hitHeight = rect.height * 0.68;
      mover.hitOffsetX = (rect.width - mover.hitWidth) / 2;
      mover.hitOffsetY = (rect.height - mover.hitHeight) / 2;
    });
  }

  function placeInsideBounds(mover) {
    const bounds = menu.getBoundingClientRect();
    const maxX = Math.max(0, bounds.width - mover.visualWidth);
    const maxY = Math.max(0, bounds.height - mover.visualHeight);

    mover.x = Math.min(Math.max(mover.x, 0), maxX);
    mover.y = Math.min(Math.max(mover.y, 0), maxY);
    mover.group.style.transform = `translate3d(${mover.x}px, ${mover.y}px, 0)`;
  }

  function randomizeMovers() {
    const bounds = menu.getBoundingClientRect();

    movers.forEach((mover) => {
      const maxX = Math.max(0, bounds.width - mover.visualWidth);
      const maxY = Math.max(0, bounds.height - mover.visualHeight);

      mover.x = Math.random() * maxX;
      mover.y = Math.random() * maxY;
      mover.vx = (0.39 + Math.random() * 0.24) * (Math.random() > 0.5 ? 1 : -1);
      mover.vy = (0.30 + Math.random() * 0.24) * (Math.random() > 0.5 ? 1 : -1);
      clampVelocity(mover);
      changeColor(mover);
      placeInsideBounds(mover);
    });
  }

  function centerMovers() {
    const bounds = menu.getBoundingClientRect();
    const gap = 70;
    const totalWidth =
      movers.reduce((sum, mover) => sum + mover.visualWidth, 0) +
      gap * Math.max(0, movers.length - 1);
    let x = Math.max(0, (bounds.width - totalWidth) / 2);
    const y = Math.max(0, (bounds.height - Math.max(...movers.map((mover) => mover.visualHeight))) / 2);

    movers.forEach((mover) => {
      mover.x = x;
      mover.y = y;
      mover.vx = 0;
      mover.vy = 0;
      placeInsideBounds(mover);
      x += mover.visualWidth + gap;
    });

    setTitlesBlack();
  }

  function boxesOverlap(first, second) {
    return (
      first.left < second.right &&
      first.right > second.left &&
      first.top < second.bottom &&
      first.bottom > second.top
    );
  }

  function pushMoverFromBox(mover, box, force = 1.1) {
    const adjustedForce = force * getAcceleration();
    const moverBox = getMoverBox(mover);
    const moverCenterX = moverBox.left + moverBox.width / 2;
    const moverCenterY = moverBox.top + moverBox.height / 2;
    const boxCenterX = box.left + box.width / 2;
    const boxCenterY = box.top + box.height / 2;
    const distanceX = moverCenterX - boxCenterX || 1;
    const distanceY = moverCenterY - boxCenterY || 1;
    const distance = Math.hypot(distanceX, distanceY) || 1;
    const overlapX = Math.min(moverBox.right - box.left, box.right - moverBox.left);
    const overlapY = Math.min(moverBox.bottom - box.top, box.bottom - moverBox.top);

    if (overlapX < overlapY) {
      const direction = distanceX > 0 ? 1 : -1;
      mover.x += direction * overlapX;
      mover.vx = Math.abs(mover.vx || adjustedForce) * direction;
    } else {
      const direction = distanceY > 0 ? 1 : -1;
      mover.y += direction * overlapY;
      mover.vy = Math.abs(mover.vy || adjustedForce) * direction;
    }

    mover.vx += (distanceX / distance) * adjustedForce;
    mover.vy += (distanceY / distance) * adjustedForce;
    clampVelocity(mover);
    placeInsideBounds(mover);
  }

  function bounceFromEachOther() {
    for (let i = 0; i < movers.length; i += 1) {
      for (let j = i + 1; j < movers.length; j += 1) {
        const first = movers[i];
        const second = movers[j];

        if (first.isDragging && second.isDragging) {
          continue;
        }

        const firstBox = getMoverBox(first);
        const secondBox = getMoverBox(second);

        if (!boxesOverlap(firstBox, secondBox)) {
          continue;
        }

        if (first.isDragging || second.isDragging) {
          const dragged = first.isDragging ? first : second;
          const hit = first.isDragging ? second : first;

          pushMoverFromBox(hit, getMoverBox(dragged), 3);
          continue;
        }

        const overlapX = Math.min(firstBox.right - secondBox.left, secondBox.right - firstBox.left);
        const overlapY = Math.min(firstBox.bottom - secondBox.top, secondBox.bottom - firstBox.top);

        if (overlapX < overlapY) {
          const push = overlapX / 2;

          if (firstBox.left < secondBox.left) {
            first.x -= push;
            second.x += push;
          } else {
            first.x += push;
            second.x -= push;
          }

          const firstVelocity = first.vx;
          first.vx = second.vx;
          second.vx = firstVelocity;
          clampVelocity(first);
          clampVelocity(second);
        } else {
          const push = overlapY / 2;

          if (firstBox.top < secondBox.top) {
            first.y -= push;
            second.y += push;
          } else {
            first.y += push;
            second.y -= push;
          }

          const firstVelocity = first.vy;
          first.vy = second.vy;
          second.vy = firstVelocity;
          clampVelocity(first);
          clampVelocity(second);
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
        mover.group.classList.add('is-dragging');
        title.setPointerCapture(event.pointerId);
      });

      title.addEventListener('pointermove', (event) => {
        if (!mover.isDragging) {
          return;
        }

        const bounds = menu.getBoundingClientRect();
        const maxX = Math.max(0, bounds.width - mover.visualWidth);
        const maxY = Math.max(0, bounds.height - mover.visualHeight);

        mover.lastDragX = mover.x;
        mover.lastDragY = mover.y;
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
        clampVelocity(mover);
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
  movers.forEach((mover) => {
    if (isBouncing) {
      changeColor(mover);
    }

    scheduleColorChange(mover);
  });

  if (isBouncing) {
    randomizeMovers();
  } else {
    centerMovers();
  }

  function animate() {
    const bounds = menu.getBoundingClientRect();

    movers.forEach((mover) => {
      if (!isBouncing || mover.isDragging) {
        return;
      }

      const maxX = Math.max(0, bounds.width - mover.visualWidth);
      const maxY = Math.max(0, bounds.height - mover.visualHeight);

      mover.x += mover.vx;
      mover.y += mover.vy;

      if (mover.x <= 0 || mover.x >= maxX) {
        mover.vx *= -1;
        mover.x = Math.min(Math.max(mover.x, 0), maxX);
        clampVelocity(mover);
      }

      if (mover.y <= 0 || mover.y >= maxY) {
        mover.vy *= -1;
        mover.y = Math.min(Math.max(mover.y, 0), maxY);
        clampVelocity(mover);
      }
    });

    if (isBouncing) {
      bounceFromEachOther();
    }

    movers.forEach((mover) => {
      placeInsideBounds(mover);
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    measureMovers();
    if (isBouncing) {
      movers.forEach(placeInsideBounds);
    } else {
      centerMovers();
    }

    updateOpenListSpace();
  });

  if (bouncingControl) {
    bouncingControl.addEventListener('change', () => {
      isBouncing = bouncingControl.checked;
      localStorage.setItem('contentsStartBouncing', String(isBouncing));

      if (isBouncing) {
        randomizeMovers();
      } else {
        centerMovers();
      }

      updateOpenListSpace();
    });
  }

  if (accelerationControl) {
    accelerationControl.addEventListener('input', () => {
      movers.forEach(clampVelocity);
    });
  }

  requestAnimationFrame(animate);
}

setupDropdowns();
setupDvdMotion();
