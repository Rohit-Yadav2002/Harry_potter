'use strict';

/* ───────────────────────── Helpers ───────────────────────── */
const $ = (sel) => document.querySelector(sel);

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  // force reflow so the transition runs
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 2800);
}

function formatTimestamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* prettify a filename into a title: "01-our-song.mp3" -> "Our Song" */
function prettifyName(filename) {
  return filename
    .replace(/\.[^.]+$/, '')           // drop extension
    .replace(/^\d+[\s._-]*/, '')        // drop leading order number
    .replace(/[._-]+/g, ' ')            // separators -> spaces
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || filename;
}

/* ───────────────────── 1. PHOTO GALLERY ───────────────────── */
async function loadPhotos() {
  const gallery = $('#gallery');
  const empty = $('#gallery-empty');
  try {
    const res = await fetch('/api/photos');
    const photos = await res.json();

    if (!Array.isArray(photos) || photos.length === 0) {
      empty.textContent = 'No memories yet — add photos to media/photos and they will appear here.';
      return;
    }

    empty.remove();
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    photos.forEach((photo) => {
      const frame = document.createElement('figure');
      frame.className = 'frame';

      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = prettifyName(photo.name);
      img.loading = 'lazy';

      frame.appendChild(img);
      gallery.appendChild(frame);
      observer.observe(frame);
    });
  } catch (err) {
    console.error('Failed to load photos', err);
    empty.textContent = 'The portraits are sleeping (could not load photos).';
  }
}

/* ───────────────────── 2. CRINGE SONGS ───────────────────── */
function setupCringeSongs() {
  const btn = $('#cringe-btn');
  const panel = $('#now-playing');
  const titleEl = $('#now-playing-title');
  const audio = $('#audio');

  let songs = [];
  let lastIndex = -1;

  async function ensureSongs() {
    if (songs.length) return songs;
    const res = await fetch('/api/songs');
    songs = await res.json();
    return songs;
  }

  btn.addEventListener('click', async () => {
    btn.classList.remove('casting');
    void btn.offsetWidth;
    btn.classList.add('casting');

    try {
      await ensureSongs();
    } catch (err) {
      console.error('Failed to load songs', err);
      showToast('Could not reach the spellbook of songs.');
      return;
    }

    if (!songs.length) {
      showToast('No songs yet — add some to media/songs ✦');
      return;
    }

    // pick a random song, avoiding an immediate repeat when possible
    let index = Math.floor(Math.random() * songs.length);
    if (songs.length > 1 && index === lastIndex) {
      index = (index + 1) % songs.length;
    }
    lastIndex = index;
    const song = songs[index];

    titleEl.textContent = prettifyName(song.name);
    audio.src = song.url;
    panel.hidden = false;
    audio.play().catch(() => {
      showToast('Tap the play button to let the music begin ✦');
    });
  });
}

/* ─────────────────── 3. OWL POST / COMPLAINTS ─────────────────── */
function setupComplaints() {
  const form = $('#complaint-form');
  const textarea = $('#complaint-message');
  const list = $('#owl-list');
  const empty = $('#owl-empty');

  const modal = $('#from-modal');
  const fromInput = $('#from-input');
  const fromConfirm = $('#from-confirm');

  let pendingMessage = '';

  function openModal() {
    fromInput.value = '';
    modal.hidden = false;
    setTimeout(() => fromInput.focus(), 50);
  }
  function closeModal() {
    modal.hidden = true;
    pendingMessage = '';
  }

  modal.querySelectorAll('[data-close]').forEach((el) =>
    el.addEventListener('click', closeModal)
  );
  document.addEventListener('keydown', (e) => {
    if (!modal.hidden && e.key === 'Escape') closeModal();
  });

  // build one accordion card; uses textContent everywhere (no HTML injection)
  function renderComplaint(complaint, prepend = false) {
    const card = document.createElement('article');
    card.className = 'owl';

    const summary = document.createElement('button');
    summary.type = 'button';
    summary.className = 'owl__summary';

    const titleWrap = document.createElement('span');
    const from = document.createElement('span');
    from.className = 'owl__from';
    from.textContent = `From: ${complaint.from}`;
    const time = document.createElement('span');
    time.className = 'owl__time';
    time.textContent = `  ·  ${formatTimestamp(complaint.createdAt)}`;
    titleWrap.appendChild(from);
    titleWrap.appendChild(time);

    const chevron = document.createElement('span');
    chevron.className = 'owl__chevron';
    chevron.textContent = '❯';

    summary.appendChild(titleWrap);
    summary.appendChild(chevron);

    const body = document.createElement('div');
    body.className = 'owl__body';
    const msg = document.createElement('p');
    msg.className = 'owl__message';
    msg.textContent = complaint.message;
    body.appendChild(msg);

    summary.addEventListener('click', () => {
      const isOpen = card.classList.toggle('is-open');
      body.style.maxHeight = isOpen ? `${body.scrollHeight}px` : '0';
    });

    card.appendChild(summary);
    card.appendChild(body);

    if (prepend) list.prepend(card);
    else list.appendChild(card);
  }

  async function loadComplaints() {
    try {
      const res = await fetch('/api/complaints');
      const complaints = await res.json();
      if (!Array.isArray(complaints) || complaints.length === 0) return;
      empty.remove();
      complaints.forEach((c) => renderComplaint(c, false));
    } catch (err) {
      console.error('Failed to load complaints', err);
      empty.textContent = 'The owls are lost in the storm (could not load).';
    }
  }

  // Step 1: message submitted -> ask "From:"
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = textarea.value.trim();
    if (!message) {
      showToast('Write your heart first ✦');
      return;
    }
    pendingMessage = message;
    openModal();
  });

  // Step 2: confirm "From:" -> send
  async function send() {
    const from = fromInput.value.trim();
    fromConfirm.disabled = true;
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: pendingMessage, from }),
      });
      if (!res.ok) throw new Error('Request failed');
      const saved = await res.json();

      if (empty && empty.parentNode) empty.remove();
      renderComplaint(saved, true);
      textarea.value = '';
      closeModal();
      showToast('Your owl has taken flight ✦');
    } catch (err) {
      console.error('Failed to send complaint', err);
      showToast('The owl got tired — please try again.');
    } finally {
      fromConfirm.disabled = false;
    }
  }

  fromConfirm.addEventListener('click', send);
  fromInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); send(); }
  });

  loadComplaints();
}

/* ─────────────────── Floating golden dust ─────────────────── */
function setupDust() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = $('#dust');
  const ctx = canvas.getContext('2d');
  let w, h, particles;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(90, Math.floor((w * h) / 22000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      vy: Math.random() * 0.3 + 0.05,
      vx: (Math.random() - 0.5) * 0.2,
      a: Math.random() * 0.6 + 0.2,
      tw: Math.random() * 0.02 + 0.005,
    }));
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.y -= p.vy;
      p.x += p.vx;
      p.a += p.tw * (Math.random() > 0.5 ? 1 : -1);
      p.a = Math.max(0.1, Math.min(0.85, p.a));
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      if (p.x < -5) p.x = w + 5;
      if (p.x > w + 5) p.x = -5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 201, 105, ${p.a})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  frame();
}

/* ─────────────────── Re-lock (seal the door) ─────────────────── */
function setupLock() {
  const link = document.getElementById('lock-link');
  if (!link) return;
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/lock', { method: 'POST' });
    } catch (err) {
      /* ignore — we redirect regardless */
    }
    window.location.href = '/login';
  });
}

/* ───────────────────────── Boot ───────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadPhotos();
  setupCringeSongs();
  setupComplaints();
  setupDust();
  setupLock();
});
