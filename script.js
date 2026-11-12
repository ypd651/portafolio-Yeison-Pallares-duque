(function () {
  "use strict";

  const GITHUB_USER = "ypd651";
  const CV_URL = "img/CV_Pallares_Duque_Yeison.pdf";
  const THEME_STORAGE_KEY = "portafolio-theme";
  const SNOW_STORAGE_KEY = "portafolio-snow";
  const REPOS_CACHE_KEY = "portafolio-repos-cache-v2";

  const root = document.documentElement;
  const toastEl = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2400);
  }

  function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(successMsg);
      }).catch(function () {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      showToast(successMsg);
    } catch (e) {
      showToast("No se pudo copiar automáticamente.");
    }
    document.body.removeChild(area);
  }

  /* ---------------------------------------------
     1. Tema Claro / Oscuro
  --------------------------------------------- */
  const themeButtons = Array.from(document.querySelectorAll(".theme-toggle-btn"));

  function applyTheme(theme) {
    const isDark = theme === "dark";
    if (isDark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    themeButtons.forEach(function (btn) {
      const label = btn.querySelector(".theme-toggle-label");
      if (label) {
        label.textContent = isDark ? "Modo claro" : "Modo oscuro";
      }
      btn.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    });
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

  themeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const isDark = root.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_STORAGE_KEY, next);
    });
  });

  /* ---------------------------------------------
     2. Nieve interactiva sutil (Canvas)
  --------------------------------------------- */
  const snowCanvas = document.getElementById("snowCanvas");
  const snowToggle = document.getElementById("snowToggle");
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let snowEnabled = !reducedMotion && localStorage.getItem(SNOW_STORAGE_KEY) !== "off";
  let snowAnimId = null;
  let flakes = [];
  let windPointerX = 0;

  function updateSnowToggleUI() {
    if (!snowToggle || !snowCanvas) return;
    snowToggle.setAttribute("aria-pressed", String(snowEnabled));
    const label = snowToggle.querySelector(".snow-toggle-label");
    if (label) {
      label.textContent = snowEnabled ? "Nieve" : "Sin nieve";
    }
    snowCanvas.classList.toggle("paused", !snowEnabled);
  }

  function resizeSnowCanvas() {
    if (!snowCanvas) return;
    snowCanvas.width = window.innerWidth;
    snowCanvas.height = window.innerHeight;
  }

  function initFlakes() {
    if (!snowCanvas) return;
    const count = window.innerWidth < 768 ? 24 : 44;
    flakes = [];
    for (let i = 0; i < count; i++) {
      flakes.push({
        x: Math.random() * snowCanvas.width,
        y: Math.random() * snowCanvas.height,
        r: 1.2 + Math.random() * 2.4,
        speedY: 0.35 + Math.random() * 0.75,
        drift: (Math.random() - 0.5) * 0.35,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.25 + Math.random() * 0.45
      });
    }
  }

  function drawSnow() {
    if (!snowEnabled || !snowCanvas) return;
    const ctx = snowCanvas.getContext("2d");
    if (!ctx) return;

    const snowRgb = getComputedStyle(root).getPropertyValue("--snow-color").trim() || "220, 232, 228";
    ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);

    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.phase += 0.012;
      f.y += f.speedY;
      f.x += f.drift + Math.sin(f.phase) * 0.28 + windPointerX * 0.25;

      if (f.y > snowCanvas.height + 6) {
        f.y = -6;
        f.x = Math.random() * snowCanvas.width;
      }
      if (f.x > snowCanvas.width + 6) f.x = -6;
      if (f.x < -6) f.x = snowCanvas.width + 6;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + snowRgb + ", " + f.opacity + ")";
      ctx.fill();
    }

    snowAnimId = requestAnimationFrame(drawSnow);
  }

  function startSnow() {
    if (!snowCanvas || snowAnimId) return;
    resizeSnowCanvas();
    if (flakes.length === 0) initFlakes();
    drawSnow();
  }

  function stopSnow() {
    if (snowAnimId) {
      cancelAnimationFrame(snowAnimId);
      snowAnimId = null;
    }
    if (snowCanvas) {
      const ctx = snowCanvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    }
  }

  updateSnowToggleUI();
  if (snowEnabled) startSnow();

  window.addEventListener("resize", function () {
    resizeSnowCanvas();
    if (snowEnabled) initFlakes();
  });

  if (window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("mousemove", function (e) {
      const ratio = (e.clientX / Math.max(window.innerWidth, 1)) - 0.5;
      windPointerX = ratio * 0.9;
    });
  }

  if (snowToggle) {
    snowToggle.addEventListener("click", function () {
      snowEnabled = !snowEnabled;
      localStorage.setItem(SNOW_STORAGE_KEY, snowEnabled ? "on" : "off");
      updateSnowToggleUI();
      if (snowEnabled) {
        startSnow();
      } else {
        stopSnow();
      }
    });
  }

  /* ---------------------------------------------
     3. Menú móvil y Navegación
  --------------------------------------------- */
  const mobileToggle = document.getElementById("mobileToggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");

  function setSidebarOpen(open) {
    if (!sidebar || !mobileToggle) return;
    sidebar.classList.toggle("open", open);
    if (sidebarBackdrop) sidebarBackdrop.classList.toggle("open", open);
    mobileToggle.setAttribute("aria-expanded", String(open));
  }

  if (mobileToggle) {
    mobileToggle.addEventListener("click", function () {
      setSidebarOpen(!sidebar.classList.contains("open"));
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", function () {
      setSidebarOpen(false);
    });
  }

  document.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      setSidebarOpen(false);
    });
  });

  /* ---------------------------------------------
     4. Scroll spy, barra de lectura y volver arriba
  --------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = "#" + entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-40% 0px -45% 0px" }
    );
    sections.forEach(function (sec) { spyObserver.observe(sec); });
  }

  const readingProgress = document.getElementById("readingProgress");
  const backToTop = document.getElementById("backToTop");

  function updateScrollEffects() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (readingProgress && docHeight > 0) {
      const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
      readingProgress.style.width = pct.toFixed(1) + "%";
    }
    if (backToTop) {
      backToTop.classList.toggle("visible", scrollTop > 420);
    }
  }

  window.addEventListener("scroll", updateScrollEffects, { passive: true });
  updateScrollEffects();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------------------------------------
     5. Animaciones de aparición al hacer scroll
  --------------------------------------------- */
  const revealEls = Array.from(document.querySelectorAll(".reveal"));

  function revealInViewport() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    revealEls.forEach(function (el) {
      if (el.classList.contains("visible")) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= vh + 40) {
        el.classList.add("visible");
      }
    });
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 20px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  window.addEventListener("scroll", revealInViewport, { passive: true });
  window.addEventListener("hashchange", function () {
    setTimeout(revealInViewport, 60);
  });
  setTimeout(revealInViewport, 80);

  /* ---------------------------------------------
     6. Brillo suave que sigue al cursor
  --------------------------------------------- */
  const cursorGlow = document.getElementById("cursorGlow");
  if (cursorGlow && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("mousemove", function (e) {
      cursorGlow.style.transform = "translate(" + e.clientX + "px, " + e.clientY + "px) translate(-50%, -50%)";
      cursorGlow.classList.add("active");
    });
    document.addEventListener("mouseleave", function () {
      cursorGlow.classList.remove("active");
    });
  }

  /* ---------------------------------------------
     7. Filtro interactivo en Proyectos Clave
  --------------------------------------------- */
  const featuredFilterBar = document.getElementById("featuredFilterBar");
  const featuredEntries = Array.from(document.querySelectorAll("#featuredList .ledger-entry"));

  if (featuredFilterBar) {
    featuredFilterBar.addEventListener("click", function (e) {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      const filter = btn.getAttribute("data-filter");

      featuredFilterBar.querySelectorAll(".filter-chip").forEach(function (chip) {
        chip.classList.toggle("active", chip === btn);
      });

      featuredEntries.forEach(function (item) {
        const categories = (item.getAttribute("data-category") || "").split(/\s+/);
        const show = filter === "all" || categories.indexOf(filter) !== -1;
        item.hidden = !show;
        if (show) item.classList.add("visible");
      });
    });
  }

  /* ---------------------------------------------
     8. Modal Vista Previa de CV & Botones Copiar
  --------------------------------------------- */
  const cvModal = document.getElementById("cvModal");
  const cvIframe = document.getElementById("cvIframe");

  function openCvModal() {
    if (!cvModal) return;
    if (cvIframe && !cvIframe.getAttribute("src")) {
      cvIframe.setAttribute("src", CV_URL);
    }
    cvModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCvModal() {
    if (!cvModal) return;
    cvModal.hidden = true;
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-open-cv]").forEach(function (btn) {
    btn.addEventListener("click", openCvModal);
  });

  document.querySelectorAll("[data-close-cv]").forEach(function (btn) {
    btn.addEventListener("click", closeCvModal);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeCvModal();
      setSidebarOpen(false);
    }
  });

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const value = btn.getAttribute("data-copy");
      if (value) copyToClipboard(value, "Copiado: " + value);
    });
  });

  /* ---------------------------------------------
     9. Repositorios Públicos de GitHub en Tiempo Real
        - Detecta automáticamente cada nuevo repo público
        - Ordenado, buscable y filtrable por lenguaje
        - Acceso directo + descripción corta garantizada
  --------------------------------------------- */
  const repoGrid = document.getElementById("repoGrid");
  const repoStatus = document.getElementById("repoStatus");
  const repoLangFilters = document.getElementById("repoLangFilters");
  const repoSearch = document.getElementById("repoSearch");
  const repoSort = document.getElementById("repoSort");
  const repoMetaLine = document.getElementById("repoMetaLine");
  const toggleAllReposBtn = document.getElementById("toggleAllReposBtn");
  const refreshReposBtn = document.getElementById("refreshReposBtn");
  const statPublicRepos = document.getElementById("statPublicRepos");

  const KNOWN_REPO_DESCRIPTIONS = {
    "autotag-docs": "Plataforma orientada a eventos para ingesta asíncrona de PDFs, fragmentación RAG, etiquetado semántico y búsqueda vectorial con Spring Boot, n8n, PostgreSQL y Qdrant.",
    "VetCare-Pro-SB": "Aplicación web full-stack para clínicas veterinarias con agenda inteligente (±29 min), alertas preventivas de vacunación y expediente clínico exportable a PDF.",
    "Spring-boot-final": "TechNova IT Helpdesk: sistema empresarial de gestión de incidentes y soporte TI con control SLA, seguridad JWT, roles RBAC, Swagger y PostgreSQL.",
    "CAMPUSDESK-Spring-boot": "Sistema de gestión académica contenerizado con Java 21, Spring Boot, PostgreSQL 17, Nginx, autenticación JWT y Docker Compose.",
    "Proyecto-SmartCity-n8n": "SmartCity-Fix: plataforma ciudadana de reportes urbanos con análisis mediante IA, automatización en n8n, Google Gemini, Google Sheets y mapas en Leaflet.",
    "PROYECTO-JS-Yeison_Pallares-D2": "CampusBuild: aplicación web para la gestión de deberes académicos y laborales con calendario interactivo y referencias obligatorias.",
    "Aeropuerto-java-aplications": "Sistema de gestión de vuelos, pasajeros y aeropuertos en Java aplicando Programación Orientada a Objetos y excepciones personalizadas.",
    "Chinook-Postgres-sql": "Taller práctico de consultas SQL avanzadas y optimización de rendimiento sobre la base de datos Chinook en PostgreSQL.",
    "simulador-gasto-diario-python": "Aplicación de consola en Python para registrar, listar y generar reportes diarios, semanales y mensuales de gastos en JSON.",
    "fundamentos-python-ejercicios": "Colección de ejercicios prácticos en Python enfocados en lógica de programación, estructuras de control y funciones modulares.",
    "reto-js-YEISON-PALLARES": "Reto práctico frontend desarrollado con HTML5, CSS3 y JavaScript Vanilla orientado a interactividad y experiencia de usuario.",
    "test-python": "Sistema modular en Python para gestión de herramientas, préstamos, usuarios, permisos, registros y reportes mediante almacenamiento JSON.",
    "practica-commits-github": "Repositorio de práctica enfocado en flujo de trabajo con Git, control de versiones y buenas prácticas de commits en GitHub.",
    "portafolio-Yeison-Pallares-duque": "Portafolio profesional interactivo con modo claro/oscuro, sincronización en vivo con GitHub y hoja de vida integrada."
  };

  const LANGUAGE_COLORS = {
    Java: "#b07219",
    Python: "#3572A5",
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    HTML: "#e34c26",
    CSS: "#563d7c",
    SQL: "#e38c00",
    Shell: "#89e051"
  };

  let allProjects = [];
  let activeLang = "Todos";
  let showAllRepos = false;

  function isSafeHttpUrl(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url.trim());
  }

  function formatRepoDisplayName(name) {
    return name
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatMonthYear(isoStr) {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("es-CO", {
        month: "short",
        year: "numeric"
      }).format(date);
    } catch (e) {
      return isoStr.slice(0, 10);
    }
  }

  function buildFallbackDescription(repo) {
    if (repo.description && repo.description.trim()) {
      return repo.description.trim();
    }
    if (KNOWN_REPO_DESCRIPTIONS[repo.name]) {
      return KNOWN_REPO_DESCRIPTIONS[repo.name];
    }
    const tech = repo.language ? "desarrollado con " + repo.language : "de código abierto";
    return "Proyecto público " + tech + " disponible en GitHub para explorar su arquitectura y código fuente.";
  }

  function extractSummaryFromReadme(markdownText) {
    if (!markdownText) return "";
    const lines = markdownText.split(/\r?\n/);
    const cleanParagraphs = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;
      if (/^#{1,6}\s/.test(line)) continue;
      if (/^(!\[|\[!\[|<img|<p|<\/p|<div|<\/div|<table|<a\s|---|\*\*\*|```)/i.test(line)) continue;
      if (/^[-*]\s+\[/.test(line)) continue;
      line = line
        .replace(/^>\s*/, "")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[*_`~]/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (line.length >= 28) {
        cleanParagraphs.push(line);
        break;
      }
    }
    if (cleanParagraphs.length === 0) return "";
    const summary = cleanParagraphs[0];
    return summary.length > 165 ? summary.slice(0, 162).trim() + "…" : summary;
  }

  function hydrateNewRepoDescriptions(repos) {
    repos.forEach(function (repo) {
      if ((repo.description && repo.description.trim()) || KNOWN_REPO_DESCRIPTIONS[repo.name]) {
        return;
      }
      const cacheKey = "readme-desc:" + repo.name + ":" + (repo.pushed_at || "");
      try {
        const cachedDesc = sessionStorage.getItem(cacheKey);
        if (cachedDesc) {
          repo._resolvedDescription = cachedDesc;
          updateRenderedDescription(repo.name, cachedDesc);
          return;
        }
      } catch (e) {}

      const branch = repo.default_branch || "main";
      fetch("https://raw.githubusercontent.com/" + GITHUB_USER + "/" + encodeURIComponent(repo.name) + "/" + encodeURIComponent(branch) + "/README.md")
        .then(function (res) {
          if (!res.ok) throw new Error("No README");
          return res.text();
        })
        .then(function (md) {
          const summary = extractSummaryFromReadme(md);
          if (summary) {
            repo._resolvedDescription = summary;
            try { sessionStorage.setItem(cacheKey, summary); } catch (e) {}
            updateRenderedDescription(repo.name, summary);
          }
        })
        .catch(function () {});
    });
  }

  function updateRenderedDescription(repoName, text) {
    if (!repoGrid) return;
    const descEl = repoGrid.querySelector('[data-repo-desc="' + CSS.escape(repoName) + '"]');
    if (descEl) {
      descEl.textContent = text;
    }
  }

  function buildLanguageFilters(repos) {
    if (!repoLangFilters) return;
    const counts = {};
    repos.forEach(function (repo) {
      const lang = repo.language || "Otros";
      counts[lang] = (counts[lang] || 0) + 1;
    });

    const langs = ["Todos"].concat(
      Object.keys(counts).sort(function (a, b) {
        if (a === "Otros") return 1;
        if (b === "Otros") return -1;
        return counts[b] - counts[a];
      })
    );

    if (langs.indexOf(activeLang) === -1) activeLang = "Todos";
    repoLangFilters.innerHTML = "";

    langs.forEach(function (lang) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip" + (lang === activeLang ? " active" : "");
      btn.textContent = lang === "Todos" ? "Todos (" + repos.length + ")" : lang + " (" + counts[lang] + ")";
      btn.addEventListener("click", function () {
        activeLang = lang;
        buildLanguageFilters(allProjects);
        renderRepos();
      });
      repoLangFilters.appendChild(btn);
    });
  }

  function createRepoCard(repo) {
    const card = document.createElement("article");
    card.className = "repo-card";

    const top = document.createElement("div");
    top.className = "repo-top";

    const titleWrap = document.createElement("div");
    const titleLink = document.createElement("a");
    titleLink.className = "repo-title-link";
    titleLink.href = isSafeHttpUrl(repo.html_url) ? repo.html_url : "#";
    titleLink.target = "_blank";
    titleLink.rel = "noopener noreferrer";
    titleLink.textContent = formatRepoDisplayName(repo.name);

    const slug = document.createElement("span");
    slug.className = "repo-slug";
    slug.textContent = repo.name;

    titleWrap.appendChild(titleLink);
    titleWrap.appendChild(slug);
    top.appendChild(titleWrap);

    if (repo.language) {
      const langBadge = document.createElement("span");
      langBadge.className = "repo-lang-badge";
      const dot = document.createElement("span");
      dot.className = "lang-dot";
      dot.style.background = LANGUAGE_COLORS[repo.language] || "var(--accent)";
      const langText = document.createElement("span");
      langText.textContent = repo.language;
      langBadge.appendChild(dot);
      langBadge.appendChild(langText);
      top.appendChild(langBadge);
    }

    const desc = document.createElement("p");
    desc.className = "repo-desc";
    desc.setAttribute("data-repo-desc", repo.name);
    desc.textContent = repo._resolvedDescription || buildFallbackDescription(repo);

    const meta = document.createElement("div");
    meta.className = "repo-meta";

    const updatedSpan = document.createElement("span");
    updatedSpan.textContent = "Actualizado: " + (formatMonthYear(repo.pushed_at || repo.updated_at) || "Reciente");
    meta.appendChild(updatedSpan);

    const starsSpan = document.createElement("span");
    starsSpan.textContent = "★ " + (repo.stargazers_count || 0);
    meta.appendChild(starsSpan);

    const actions = document.createElement("div");
    actions.className = "repo-actions";

    const btnGroup = document.createElement("div");
    btnGroup.className = "repo-btn-group";

    const directBtn = document.createElement("a");
    directBtn.className = "repo-direct-btn";
    directBtn.href = isSafeHttpUrl(repo.html_url) ? repo.html_url : "#";
    directBtn.target = "_blank";
    directBtn.rel = "noopener noreferrer";
    directBtn.textContent = "Abrir proyecto →";
    btnGroup.appendChild(directBtn);

    if (isSafeHttpUrl(repo.homepage)) {
      const demoBtn = document.createElement("a");
      demoBtn.className = "repo-demo-btn";
      demoBtn.href = repo.homepage;
      demoBtn.target = "_blank";
      demoBtn.rel = "noopener noreferrer";
      demoBtn.textContent = "Demo ↗";
      btnGroup.appendChild(demoBtn);
    }

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "repo-copy-btn";
    copyBtn.textContent = "Copiar URL";
    copyBtn.addEventListener("click", function () {
      copyToClipboard(repo.html_url, "Enlace copiado: " + repo.name);
    });

    actions.appendChild(btnGroup);
    actions.appendChild(copyBtn);

    card.appendChild(top);
    card.appendChild(desc);
    card.appendChild(meta);
    card.appendChild(actions);
    return card;
  }

  function renderRepos() {
    if (!repoGrid) return;
    const query = repoSearch ? repoSearch.value.trim().toLowerCase() : "";
    const sortBy = repoSort ? repoSort.value : "recent";

    let filtered = allProjects.filter(function (repo) {
      const langLabel = repo.language || "Otros";
      const matchesLang = activeLang === "Todos" || langLabel === activeLang;
      if (!matchesLang) return false;
      if (!query) return true;

      const textToSearch = [
        repo.name,
        formatRepoDisplayName(repo.name),
        repo._resolvedDescription || buildFallbackDescription(repo),
        repo.language || ""
      ].join(" ").toLowerCase();

      return textToSearch.indexOf(query) !== -1;
    });

    filtered = filtered.slice().sort(function (a, b) {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      }
      if (sortBy === "stars") {
        const diff = (b.stargazers_count || 0) - (a.stargazers_count || 0);
        if (diff !== 0) return diff;
      }
      return new Date(b.pushed_at || b.updated_at || 0) - new Date(a.pushed_at || a.updated_at || 0);
    });

    const isFiltering = Boolean(query) || activeLang !== "Todos";
    const visibleRepos = isFiltering || showAllRepos ? filtered : filtered.slice(0, 6);

    if (repoMetaLine) {
      if (filtered.length === 0) {
        repoMetaLine.textContent = "No se encontraron proyectos con ese filtro.";
      } else {
        repoMetaLine.textContent =
          "Mostrando " + visibleRepos.length + " de " + filtered.length + " proyectos públicos ordenados.";
      }
    }

    repoGrid.innerHTML = "";

    if (visibleRepos.length === 0) {
      const empty = document.createElement("p");
      empty.className = "repos-status";
      empty.textContent = "No hay repositorios que coincidan con tu búsqueda actual.";
      repoGrid.appendChild(empty);
    } else {
      visibleRepos.forEach(function (repo) {
        repoGrid.appendChild(createRepoCard(repo));
      });
    }

    if (toggleAllReposBtn) {
      if (!isFiltering && filtered.length > 6) {
        toggleAllReposBtn.hidden = false;
        toggleAllReposBtn.textContent = showAllRepos
          ? "Mostrar los 6 más recientes"
          : "Ver todos los proyectos (" + filtered.length + ")";
      } else {
        toggleAllReposBtn.hidden = true;
      }
    }
  }

  function processGithubRepos(rawRepos, fromCache) {
    // Mantiene automáticamente todo proyecto público nuevo (excluye perfil y repos vacíos/forks).
    allProjects = rawRepos.filter(function (repo) {
      if (!repo || !repo.name) return false;
      if (repo.name.toLowerCase() === GITHUB_USER.toLowerCase()) return false;
      if (repo.fork) return false;
      if (repo.size === 0) return false;
      return true;
    });

    if (statPublicRepos) {
      statPublicRepos.textContent = String(allProjects.length);
    }

    if (allProjects.length === 0) {
      if (repoStatus) repoStatus.textContent = "Todavía no hay repositorios públicos — vuelve pronto.";
      return;
    }

    buildLanguageFilters(allProjects);
    renderRepos();
    hydrateNewRepoDescriptions(allProjects);

    if (fromCache && repoMetaLine) {
      repoMetaLine.textContent += " (mostrando copia reciente en caché)";
    }
  }

  function fetchGithubRepos(isManualRefresh) {
    if (!repoGrid) return;
    if (refreshReposBtn) refreshReposBtn.classList.add("spinning");

    fetch("https://api.github.com/users/" + GITHUB_USER + "/repos?sort=pushed&direction=desc&per_page=100", {
      headers: { Accept: "application/vnd.github+json" }
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Error HTTP " + res.status);
        return res.json();
      })
      .then(function (repos) {
        if (!Array.isArray(repos)) throw new Error("Respuesta inválida");
        try {
          localStorage.setItem(REPOS_CACHE_KEY, JSON.stringify({
            savedAt: Date.now(),
            repos: repos
          }));
        } catch (e) {}
        processGithubRepos(repos, false);
        if (isManualRefresh) {
          showToast("GitHub sincronizado: " + allProjects.length + " proyectos públicos.");
        }
      })
      .catch(function () {
        let restored = false;
        try {
          const cached = JSON.parse(localStorage.getItem(REPOS_CACHE_KEY) || "null");
          if (cached && Array.isArray(cached.repos) && cached.repos.length > 0) {
            processGithubRepos(cached.repos, true);
            restored = true;
          }
        } catch (e) {}

        if (!restored && repoStatus) {
          repoStatus.textContent = "No se pudieron cargar los repositorios en este momento. Visita el perfil directamente en GitHub.";
        }
        if (isManualRefresh) {
          showToast(restored ? "Mostrando caché local (límite temporal de GitHub)." : "No se pudo conectar con GitHub.");
        }
      })
      .finally(function () {
        if (refreshReposBtn) refreshReposBtn.classList.remove("spinning");
      });
  }

  if (repoSearch) {
    repoSearch.addEventListener("input", renderRepos);
  }
  if (repoSort) {
    repoSort.addEventListener("change", renderRepos);
  }
  if (toggleAllReposBtn) {
    toggleAllReposBtn.addEventListener("click", function () {
      showAllRepos = !showAllRepos;
      renderRepos();
    });
  }
  if (refreshReposBtn) {
    refreshReposBtn.addEventListener("click", function () {
      fetchGithubRepos(true);
    });
  }

  fetchGithubRepos(false);

})();
