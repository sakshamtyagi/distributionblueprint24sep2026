document.addEventListener("DOMContentLoaded", () => {
  const loader = document.querySelector(".page-loader");
  if (!loader) return;

  /* Fast hide after DOM ready */
  const fastHide = setTimeout(() => {
    loader.classList.add("hide");
  }, 300);

  /* Hard limit (in case something blocks) */
  setTimeout(() => {
    loader.classList.add("hide");
    clearTimeout(fastHide);
  }, 2000);

  /* Show loader on link click */
  document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      loader.classList.remove("hide");
      loader.style.display = "flex";
    });
  });
});
