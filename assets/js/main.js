(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme (persisted)
  const THEME_KEY = "keh_theme";
  const root = document.documentElement;
  const themeBtn = $("#themeBtn");

  function setTheme(mode) {
    if (!mode) {
      root.removeAttribute("data-theme");
      localStorage.removeItem(THEME_KEY);
      return;
    }
    root.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_KEY, mode);
  }

  // Init theme:
  // 1) localStorage
  // 2) prefers-color-scheme
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    setTheme(saved);
  } else {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    setTheme(prefersDark ? "dark" : "light");
  }

  themeBtn?.addEventListener("click", () => {
    const cur = root.getAttribute("data-theme");
    setTheme(cur === "dark" ? "light" : "dark");
  });

  // Mobile menu
  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");
  menuBtn?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    menuBtn.textContent = isOpen ? "✕" : "☰";
  });

  // Close menu on link click (mobile)
  $$("#navLinks a").forEach(a => {
    a.addEventListener("click", () => {
      if (!navLinks.classList.contains("open")) return;
      navLinks.classList.remove("open");
      menuBtn?.setAttribute("aria-expanded", "false");
      if (menuBtn) menuBtn.textContent = "☰";
    });
  });

  // Scroll progress + back-to-top
  const scrollBar = $("#scrollBar");
  const toTop = $("#toTop");

  function onScroll() {
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    const p = total > 0 ? (doc.scrollTop / total) : 0;
    if (scrollBar) scrollBar.style.transform = `scaleX(${p})`;
    if (toTop) toTop.classList.toggle("show", doc.scrollTop > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // Copy helper
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  // Copy "Sobre mí"
  const copyAboutBtn = $("#copyAboutBtn");
  const aboutText = $("#aboutText");
  copyAboutBtn?.addEventListener("click", async () => {
    const text = (aboutText?.innerText || "").trim();
    if (!text) return;
    const ok = await copyToClipboard(text);
    const prev = copyAboutBtn.textContent;
    copyAboutBtn.textContent = ok ? "Copiado ✓" : "Error";
    setTimeout(() => (copyAboutBtn.textContent = prev), 1200);
  });

  // Copy profile summary
  const copyProfileBtn = $("#copyProfileBtn");
  const copyNote = $("#copyNote");
  copyProfileBtn?.addEventListener("click", async () => {
    const summary =
      "Embedded software engineer: C/C++ firmware, drivers and industrial comms (I2C/SPI/UART/CAN). " +
      "Automation with Python/Bash. Embedded Linux and product-oriented engineering (quality, validation, maintainability).";
    const ok = await copyToClipboard(summary);
    if (copyNote) copyNote.textContent = ok ? "Resumen copiado al portapapeles." : "No se pudo copiar.";
    const prev = copyProfileBtn.textContent;
    copyProfileBtn.textContent = ok ? "Copiado ✓" : "Error";
    setTimeout(() => (copyProfileBtn.textContent = prev), 1200);
  });

  // Copy project links
  $$("button[data-share]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const url = btn.getAttribute("data-share");
      if (!url) return;
      const ok = await copyToClipboard(url);
      const prev = btn.textContent;
      btn.textContent = ok ? "Copiado ✓" : "Error";
      setTimeout(() => (btn.textContent = prev || "Copiar link"), 1200);
    });
  });

  // Filter + search
  const searchInput = $("#searchInput");
  const tagFilter = $("#tagFilter");
  const projects = $$("#projectsGrid .project");
  const resultsNote = $("#resultsNote");

  function applyFilters() {
    const q = (searchInput?.value || "").toLowerCase().trim();
    const tag = tagFilter?.value || "all";
    let visible = 0;

    projects.forEach(p => {
      const title = (p.querySelector("h3")?.innerText || "").toLowerCase();
      const desc = (p.querySelector("p")?.innerText || "").toLowerCase();
      const tags = (p.getAttribute("data-tags") || "").toLowerCase();

      const matchesText = !q || title.includes(q) || desc.includes(q) || tags.includes(q);
      const matchesTag = (tag === "all") || tags.includes(tag);

      const show = matchesText && matchesTag;
      p.style.display = show ? "" : "none";
      if (show) visible++;
    });

    const total = projects.length;
    if (resultsNote) resultsNote.textContent = (visible === total) ? "" : `Mostrando ${visible} de ${total} proyectos.`;
  }

  searchInput?.addEventListener("input", applyFilters);
  tagFilter?.addEventListener("change", applyFilters);
  applyFilters();

  // Nav active on scroll
  const navAs = $$(".topbar-links a");
  const sections = navAs.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  const obsNav = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navAs.forEach(a => a.classList.remove("active"));
      const id = `#${e.target.id}`;
      const active = navAs.find(a => a.getAttribute("href") === id);
      if (active) active.classList.add("active");
    });
  }, { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 });
  sections.forEach(s => obsNav.observe(s));

  // Reveal on scroll
  const revealEls = $$(".reveal");
  const obsReveal = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        obsReveal.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => obsReveal.observe(el));

  // Skill cards: toggle details on click/enter/space
  $$(".skill").forEach(card => {
    const toggle = () => card.classList.toggle("open");
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        toggle();
      }
    });
  });

  // Chips: pre-filter and scroll to projects
  $$(".chip-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-chip");
      const map = { c: "c", embedded: "embedded", comms: "embedded", python: "python", data: "data", tools: "tools" };
      const val = map[key] || "all";
      if (tagFilter) tagFilter.value = val;
      applyFilters();
      document.querySelector("#proyectos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

    // Subtle parallax on hero blobs (very light)
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!prefersReduced) {
    const hero = document.querySelector(".hero");
    if (hero) {
      hero.addEventListener("mousemove", (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        hero.style.transform = `translateY(0) perspective(900px) rotateX(${(-y*1.2).toFixed(2)}deg) rotateY(${(x*1.2).toFixed(2)}deg)`;
      });
      hero.addEventListener("mouseleave", () => {
        hero.style.transform = "";
      });
    }
  }
})();
