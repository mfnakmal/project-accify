(function(){
  const KEY = "accify_theme"; // "light" | "dark"
  const root = document.documentElement;

  function apply(theme){
    if(theme === "light"){ root.setAttribute("data-theme","light"); }
    else { root.removeAttribute("data-theme"); }
    // update icon
    document.querySelectorAll("#themeToggle").forEach(btn=>{
      btn.textContent = theme === "light" ? "☀️" : "🌙";
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    });
  }

  // initial: localStorage -> system preference -> dark
  let theme = localStorage.getItem(KEY);
  if(!theme){
    const prefersLight = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;
    theme = prefersLight ? "light" : "dark";
  }
  apply(theme);

  // bind all toggles (works on every page)
  window.addEventListener("click", (e)=>{
    const tgt = e.target.closest("#themeToggle");
    if(!tgt) return;
    theme = (root.getAttribute("data-theme")==="light") ? "dark" : "light";
    localStorage.setItem(KEY, theme);
    apply(theme);
  });

  // optional: react to system changes (only if user belum memilih)
  if(!localStorage.getItem(KEY) && window.matchMedia){
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (mq)=>{
      apply(mq.matches ? "light" : "dark");
    });
  }
})();
