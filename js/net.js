// Shared network behind frosted panes on the landing, Writing, and About pages.
(function network() {
  const canvas = document.getElementById("net");
  if (!canvas) return;
  // Quarto injects the canvas after <main>, which would paint the glare over cards.
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext("2d");

  const mouse = {
    x: innerWidth * 0.72,
    y: innerHeight * 0.22,
    tx: innerWidth * 0.72,
    ty: innerHeight * 0.22,
    on: false,
  };
  let nodes = [];
  let w = 0;
  let h = 0;
  let dpr = 1;
  let lastBirth = 0;
  let raf = 0;
  let running = false;
  let panes = [];
  let currents = [];

  function collectPanes() {
    panes = Array.from(document.querySelectorAll(".frost-pane"));
  }

  function pointInRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function updateFrost() {
    collectPanes();
    for (const pane of panes) {
      const on = mouse.on && pointInRect(mouse.tx, mouse.ty, pane.getBoundingClientRect());
      pane.classList.toggle("is-frosted", on);
    }
  }

  function count() {
    return Math.round(Math.min(140, Math.max(48, (w * h) / 14000)));
  }

  function makePack(cap, spread) {
    return {
      x: 80 + Math.random() * Math.max(1, w - 160),
      y: 80 + Math.random() * Math.max(1, h - 160),
      heading: Math.random() * Math.PI * 2,
      cruise: 0.06 + Math.random() * 0.035,
      phase: Math.random() * Math.PI * 2,
      size: 0,
      cap,
      spread,
    };
  }

  function placeAwayFromPacks() {
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const clear = currents.every((c) => {
        const dx = c.x - x;
        const dy = c.y - y;
        return dx * dx + dy * dy > (c.spread + 80) * (c.spread + 80);
      });
      if (clear) return { x, y };
    }
    return { x: Math.random() * w, y: Math.random() * h };
  }

  function finish(n) {
    n.wander = Math.random() * Math.PI * 2;
    n.life = 0;
    n.max = 520 + Math.random() * 1100;
    n.phase = Math.random() * Math.PI * 2;
  }

  function leavePack(n) {
    if (n.pack) n.pack.size = Math.max(0, n.pack.size - 1);
    n.pack = null;
  }

  function spawnClustered(n, pack, hub) {
    leavePack(n);
    n.pack = pack;
    n.lone = false;
    pack.size += 1;
    const ang = Math.random() * Math.PI * 2;
    const rad = 28 + Math.sqrt(Math.random()) * Math.max(12, pack.spread - 28);
    n.ox = Math.cos(ang) * rad;
    n.oy = Math.sin(ang) * rad;
    n.x = pack.x + n.ox;
    n.y = pack.y + n.oy;
    n.vx = Math.cos(pack.heading) * pack.cruise;
    n.vy = Math.sin(pack.heading) * pack.cruise;
    n.hub = !!hub;
    n.r = hub ? 1.85 + Math.random() * 0.45 : 1.15 + Math.random() * 0.7;
    n.copper = hub || Math.random() < 0.06;
    finish(n);
  }

  function spawnLoner(n) {
    leavePack(n);
    n.lone = true;
    const p = placeAwayFromPacks();
    n.x = p.x;
    n.y = p.y;
    n.heading = Math.random() * Math.PI * 2;
    n.cruise = 0.07 + Math.random() * 0.04;
    n.vx = Math.cos(n.heading) * n.cruise;
    n.vy = Math.sin(n.heading) * n.cruise;
    n.hub = false;
    n.r = 1.1 + Math.random() * 0.7;
    n.copper = Math.random() < 0.1;
    finish(n);
  }

  function spawn(n) {
    if (n.pack) {
      spawnClustered(n, n.pack, n.hub);
      return;
    }
    spawnLoner(n);
  }

  function addPack(cap, spread, hubs) {
    const pack = makePack(cap, spread);
    currents.push(pack);
    const hubAt = new Set();
    while (hubAt.size < Math.min(hubs, cap)) {
      hubAt.add(Math.floor(Math.random() * cap));
    }
    for (let i = 0; i < cap; i++) {
      const n = {};
      spawnClustered(n, pack, hubAt.has(i));
      n.life = Math.random() * n.max;
      nodes.push(n);
    }
  }

  function seedField() {
    currents = [];
    nodes = [];
    const target = count();
    let loners = Math.max(5, Math.round(target * 0.14));
    let left = target - loners;

    const bigN = left > 80 ? 3 : 2;
    for (let i = 0; i < bigN && left >= 16; i++) {
      const cap = Math.min(left - 8, 13 + Math.floor(Math.random() * 5));
      addPack(cap, 190 + Math.random() * 40, 1);
      left -= cap;
    }
    while (left >= 4) {
      let cap = 4 + Math.floor(Math.random() * 5);
      if (cap > left) cap = left;
      if (cap < 4) break;
      addPack(cap, 78 + Math.random() * 22, 1);
      left -= cap;
    }
    loners += left;
    for (let i = 0; i < loners; i++) {
      const n = {};
      spawnLoner(n);
      n.life = Math.random() * n.max;
      nodes.push(n);
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!nodes.length) seedField();
    const target = count();
    while (nodes.length < target) {
      const n = {};
      spawnLoner(n);
      n.life = Math.random() * n.max;
      nodes.push(n);
    }
    while (nodes.length > target) leavePack(nodes.pop());
  }

  function fade(n) {
    const a = n.life / 50;
    const b = (n.max - n.life) / 70;
    return Math.max(0, Math.min(1, a, b));
  }

  // Move the whole clump together so a wrap cannot yank members across the screen.
  function wrapPack(c) {
    let dx = 0;
    let dy = 0;
    if (c.x < -80) dx = w + 160;
    else if (c.x > w + 80) dx = -(w + 160);
    if (c.y < -80) dy = h + 160;
    else if (c.y > h + 80) dy = -(h + 160);
    if (!dx && !dy) return;
    c.x += dx;
    c.y += dy;
    for (const n of nodes) {
      if (n.pack === c) {
        n.x += dx;
        n.y += dy;
      }
    }
  }

  function step(t) {
    if (!running) return;
    mouse.x += (mouse.tx - mouse.x) * 0.07;
    mouse.y += (mouse.ty - mouse.y) * 0.07;
    updateFrost();
    ctx.clearRect(0, 0, w, h);

    if (mouse.on) {
      ctx.save();
      const flare = (x, y, color, r) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(15,37,55,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };
      const prev = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "screen";
      flare(mouse.x - 7, mouse.y - 2, "rgba(255, 72, 48, 0.16)", 160);
      flare(mouse.x + 6, mouse.y + 3, "rgba(48, 170, 255, 0.12)", 170);
      flare(mouse.x, mouse.y, "rgba(223, 105, 25, 0.14)", 220);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mouse.x - 46, mouse.y);
      ctx.lineTo(mouse.x + 46, mouse.y);
      ctx.moveTo(mouse.x, mouse.y - 28);
      ctx.lineTo(mouse.x, mouse.y + 28);
      ctx.stroke();
      ctx.globalCompositeOperation = prev;
      ctx.restore();
    }

    const link = Math.min(150, Math.max(90, Math.sqrt(w * h) * 0.055));
    const mouseR = link * 1.35;

    for (const c of currents) {
      c.phase += 0.0014;
      c.heading += Math.sin(c.phase) * 0.003;
      c.x += Math.cos(c.heading) * c.cruise;
      c.y += Math.sin(c.heading) * c.cruise;
      wrapPack(c);
    }

    if (t - lastBirth > 900 && mouse.on) {
      lastBirth = t;
      const dying = nodes.find((n) => n.life > n.max * 0.7);
      if (dying) dying.life = dying.max - 40;
      const baby = {};
      spawnLoner(baby);
      nodes.push(baby);
      if (nodes.length > count() + 8) {
        nodes.sort((a, b) => a.life / a.max - b.life / b.max);
        leavePack(nodes.shift());
      }
    }

    for (const n of nodes) {
      n.life += 1;
      n.phase += 0.003;
      n.wander += 0.0035;

      if (n.lone) {
        n.heading += Math.sin(n.phase) * 0.0025;
        const tx = Math.cos(n.heading) * n.cruise + Math.cos(n.wander) * 0.018;
        const ty = Math.sin(n.heading) * n.cruise + Math.sin(n.wander) * 0.018;
        n.vx += (tx - n.vx) * 0.03;
        n.vy += (ty - n.vy) * 0.03;
      } else {
        const pack = n.pack;
        const homeX = pack.x + n.ox + Math.cos(n.wander) * 7;
        const homeY = pack.y + n.oy + Math.sin(n.wander * 0.9) * 7;
        n.vx += (Math.cos(pack.heading) * pack.cruise + (homeX - n.x) * 0.05 - n.vx) * 0.08;
        n.vy += (Math.sin(pack.heading) * pack.cruise + (homeY - n.y) * 0.05 - n.vy) * 0.08;
      }

      if (mouse.on) {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < mouseR * mouseR && d2 > 16) {
          const d = Math.sqrt(d2);
          const f = (1 - d / mouseR) * 0.008;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }
      }

      n.x += n.vx;
      n.y += n.vy;
      if (n.lone) {
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }

      if (n.life > n.max) spawn(n);
    }

    ctx.lineWidth = 0.7;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const fa = fade(a);
      if (fa <= 0 || a.lone) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const fb = fade(b);
        if (fb <= 0 || b.lone || a.pack !== b.pack) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        const reach = Math.min(link, a.pack.spread * 0.62);
        if (d2 > reach * reach) continue;
        const d = Math.sqrt(d2);
        const p = (1 - d / reach) * fa * fb;
        const copper = a.copper || b.copper;
        ctx.strokeStyle = copper
          ? `rgba(223,105,25,${0.16 + p * 0.28})`
          : `rgba(235,235,235,${0.04 + p * 0.16})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      if (mouse.on) {
        const dx = a.x - mouse.x;
        const dy = a.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < mouseR * mouseR) {
          const d = Math.sqrt(d2);
          const p = (1 - d / mouseR) * fa;
          ctx.strokeStyle = `rgba(240,162,102,${0.08 + p * 0.32})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      const f = fade(n);
      if (f <= 0) continue;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.copper
        ? `rgba(223,105,25,${n.hub ? 0.62 + f * 0.38 : 0.35 + f * 0.45})`
        : `rgba(235,235,235,${n.hub ? 0.5 + f * 0.4 : 0.2 + f * 0.38})`;
      ctx.fill();
    }

    if (mouse.on) {
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  window.addEventListener("resize", () => {
    resize();
    collectPanes();
  }, { passive: true });
  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      mouse.on = true;
    },
    { passive: true }
  );
  window.addEventListener("mouseleave", () => {
    mouse.on = false;
    updateFrost();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  collectPanes();
  resize();
  start();
})();

// Pulse Building as soon as the section is the jump target.
(function arriveBuilding() {
  const section = document.getElementById("building");
  if (!section) return;

  const navLink = document.querySelector('.navbar-nav a[href*="#building"]');
  let arriveTimer;

  function syncNav() {
    if (!navLink) return;
    navLink.classList.toggle("active", location.hash === "#building");
  }

  function play() {
    section.querySelectorAll(".arrive-scan").forEach((node) => node.remove());
    const scan = document.createElement("div");
    scan.className = "arrive-scan";
    scan.setAttribute("aria-hidden", "true");
    scan.innerHTML = '<div class="arrive-scan-slice"><div class="arrive-scan-ring"></div></div>';
    section.appendChild(scan);
    section.classList.add("is-arriving");
    clearTimeout(arriveTimer);
    arriveTimer = setTimeout(() => {
      scan.remove();
      section.classList.remove("is-arriving");
    }, 1250);
  }

  function requestArrive() {
    section.scrollIntoView({ behavior: "auto", block: "start" });
    play();
  }

  if (navLink) {
    navLink.addEventListener("click", (event) => {
      event.preventDefault();
      if (location.hash !== "#building") {
        history.pushState(null, "", "#building");
      }
      syncNav();
      requestArrive();
    });
  }

  window.addEventListener("hashchange", () => {
    syncNav();
    if (location.hash === "#building") requestArrive();
  });

  syncNav();
  if (location.hash === "#building") {
    requestArrive();
  }
})();
