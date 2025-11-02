const pixBtn = document.querySelector("button.pix");

pixBtn.addEventListener("click", async () => {
  const value = pixBtn.getAttribute("data-value");

  await navigator.clipboard.writeText(value);

  pixBtn.classList.add("copied");

  setTimeout(() => {
    pixBtn.classList.remove("copied");
  }, 2000);
});