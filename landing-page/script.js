document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("prep-modal");
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector("p");

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  document.querySelectorAll(".js-open-modal").forEach((button) => {
    button.addEventListener("click", () => {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      modal.querySelector(".modal-close-button").focus();
    });
  });

  modal.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    document.body.classList.remove("modal-open");
  };

  document.querySelectorAll(".js-lightbox").forEach((element) => {
    element.addEventListener("click", () => {
      const image = element.querySelector("img");
      const fullImage = element.dataset.fullImage || image.currentSrc || image.src;
      lightboxImage.src = fullImage;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent = element.dataset.caption || image.alt;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      lightbox.querySelector(".lightbox-close").focus();
    });
  });

  lightbox.querySelectorAll("[data-close-lightbox]").forEach((button) => {
    button.addEventListener("click", closeLightbox);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (modal.classList.contains("is-open")) closeModal();
      if (lightbox.classList.contains("is-open")) closeLightbox();
    }
  });

  document.querySelectorAll(".faq-question").forEach((question) => {
    question.addEventListener("click", () => {
      const item = question.closest(".faq-item");
      const isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item").forEach((otherItem) => {
        otherItem.classList.remove("is-open");
        otherItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        otherItem.querySelector(".faq-question i").textContent = "+";
      });
      if (!isOpen) {
        item.classList.add("is-open");
        question.setAttribute("aria-expanded", "true");
        question.querySelector("i").textContent = "−";
      }
    });
  });

  const comparePanel = document.querySelector(".compare-panel");
  const compareLabel = comparePanel.querySelector(".compare-label");
  const compareText = comparePanel.querySelector(".compare-text");
  const compareStates = {
    before: {
      label: "일반 동승",
      text: "급브레이크마다 조수석으로 쏠림 · 운전 중 무릎 위로 올라옴 · 시트에 남는 털과 오염",
    },
    after: {
      label: "LETO와 함께",
      text: "등받이까지 2중 고정 · 아이를 감싸는 볼스터 가드 · 생활 방수와 올커버 분리 세탁",
    },
  };

  document.querySelectorAll(".compare-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const state = tab.dataset.state;
      document.querySelectorAll(".compare-tab").forEach((button) => {
        const selected = button === tab;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-selected", String(selected));
      });
      comparePanel.dataset.current = state;
      compareLabel.textContent = compareStates[state].label;
      compareText.textContent = compareStates[state].text;
    });
  });

  document.querySelectorAll(".step").forEach((step) => {
    step.addEventListener("mouseenter", () => {
      document.querySelectorAll(".step").forEach((otherStep) => otherStep.classList.remove("is-highlighted"));
      step.classList.add("is-highlighted");
    });
    step.addEventListener("focusin", () => step.classList.add("is-highlighted"));
  });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  document.querySelectorAll("img[data-fallback]").forEach((image) => {
    image.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "image-fallback";
      fallback.dataset.label = image.dataset.fallback;
      image.replaceWith(fallback);
    }, { once: true });
  });

  // --- GA4 Tracking Logic (Section View & CTA Click) ---
  initGA4Tracking();
});

function initGA4Tracking() {
  if (window.__ga4_tracking_initialized) return;
  window.__ga4_tracking_initialized = true;

  const sendEvent = (eventName, params) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
  };

  // 1. 구간 도달 측정 (section_view)
  const sentSections = new Set();
  const sectionTargets = [
    { id: "hero-title", name: "hero" },
    { id: "detail-space-title", name: "detail" },
    { id: "purchase-title", name: "cta" },
  ];

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const targetId = entry.target.id;
            const targetConfig = sectionTargets.find((s) => s.id === targetId);
            if (targetConfig && !sentSections.has(targetConfig.name)) {
              if (document.visibilityState === "visible") {
                sentSections.add(targetConfig.name);
                sendEvent("section_view", { section_name: targetConfig.name });
                sectionObserver.unobserve(entry.target);
              }
            }
          }
        });
      },
      {
        threshold: [0.5],
        rootMargin: "-70px 0px 0px 0px", // 70px 고정 헤더 영역 보정
      }
    );

    sectionTargets.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el && !sentSections.has(item.name)) {
        sectionObserver.observe(el);
      }
    });

    // 다른 탭에서 돌아왔을 때 현재 보이는 제목 체크 및 누락 방지
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        sectionTargets.forEach((item) => {
          if (!sentSections.has(item.name)) {
            const el = document.getElementById(item.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              const vHeight = window.innerHeight;
              const vWidth = window.innerWidth;
              const visibleTop = Math.max(rect.top, 70);
              const visibleBottom = Math.min(rect.bottom, vHeight);
              const visibleLeft = Math.max(rect.left, 0);
              const visibleRight = Math.min(rect.right, vWidth);
              const visibleHeight = Math.max(0, visibleBottom - visibleTop);
              const visibleWidth = Math.max(0, visibleRight - visibleLeft);
              const totalArea = rect.height * rect.width;
              if (totalArea > 0 && (visibleHeight * visibleWidth) / totalArea >= 0.5) {
                sentSections.add(item.name);
                sendEvent("section_view", { section_name: item.name });
                sectionObserver.unobserve(el);
              }
            }
          }
        });
      }
    });
  }

  // 2. CTA 클릭 측정 (cta_click)
  const ctaMap = [
    { selector: "#cta-hero, [data-cta-location='hero']", location: "hero" },
    { selector: "#cta-final, [data-cta-location='final']", location: "final" },
  ];

  const boundCtaElements = new Set();

  ctaMap.forEach((config) => {
    const elements = document.querySelectorAll(config.selector);
    elements.forEach((el) => {
      if (!boundCtaElements.has(el)) {
        boundCtaElements.add(el);
        el.addEventListener("click", () => {
          sendEvent("cta_click", { button_location: config.location });
        });
      }
    });
  });
}
