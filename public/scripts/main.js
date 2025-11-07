const pixBtn = document.querySelector("button.pix");
const productsList = document.querySelector("#products>.list");
const productAnother = productsList.querySelector(".another");
const availableProducts = productsList.querySelectorAll('div[data-product-id]');
const dialog = document.getElementById("reservation");
const dialogTitle = dialog?.querySelector("header>h4");
const dialogForm = dialog?.querySelector("form");
const dialogConfirmButton = dialog?.querySelector("button.confirm");
const dialogDeleteButton = dialog?.querySelector("button.delete");
const dialogCloseButton = dialog?.querySelector("button.cancel");
const dialogCancelButton = dialog?.querySelector("button.close");

let products = [];
let customGifts = [];

pixBtn.addEventListener("click", async () => {
  const value = pixBtn.getAttribute("data-value");

  await navigator.clipboard.writeText(value);

  pixBtn.classList.add("copied");

  setTimeout(() => {
    pixBtn.classList.remove("copied");
  }, 2000);
});

dialogCloseButton.addEventListener("click", () => {
  dialogForm.reset();
  dialog.close();
});

dialogCancelButton.addEventListener("click", () => {
  dialogForm.reset();
  dialog.close();
});

const dialogAttrObserver = new MutationObserver((mutations) => {
  mutations.forEach(async mutation => {
    if (mutation.attributeName === "open") {
      const dialog = mutation.target;
      const isOpen = dialog.hasAttribute("open");

      if (isOpen) dialog.removeAttribute("inert");
      else dialog.setAttribute("inert", "");
    }
  })
});

dialogAttrObserver.observe(dialog, {
  attributes: true,
});

dialogDeleteButton.addEventListener("click", async () => {
  const formData = Object.fromEntries(new FormData(dialogForm).entries());

  dialogForm.reset();
  dialog.close();

  // TODO: Implementar remoção de reserva
});

dialogForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  dialog.inert = true;
  dialogConfirmButton.classList.add("loading");

  const formData = Object.fromEntries(new FormData(dialogForm).entries());
  const reservationId = localStorage.getItem("reservation-id") || crypto.randomUUID();

  try {
    const response = await fetch('/api/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId,
        productId: formData.id ? parseInt(formData.id) : null,
        fullName: formData.name,
        customGift: formData.customGift || null
      })
    });

    if (response.ok) {
      localStorage.setItem("reservation-id", reservationId);
      dialogForm.reset();
      dialog.close();

      const prodElem = productsList.querySelector(`[data-product-id="${formData.id}"]`);
      prodElem.classList.remove("available");
      prodElem.dataset.reservationId = reservationId;
      prodElem.querySelector(".owner>span").textContent = "Reservado por";
      prodElem.querySelector(".owner>b").textContent = formData.name;

    } else if (response.status === 409) {
      alert('Este produto já foi reservado por outra pessoa.');
    } else {
      alert('Erro ao reservar produto. Tente novamente.');
    }
  } catch (error) {
    console.error('Erro ao reservar:', error);
    alert('Erro ao reservar produto. Tente novamente.');
  }

  dialog.inert = false;
  dialogConfirmButton.classList.remove("loading");
});

function openReservationDialog(productId = null, productName = null, reservationId = "", reservedBy = "") {
  dialogForm.reset();

  const mainSection = dialogForm.querySelector('main');
  const deleteButton = dialogForm.querySelector('button.delete');
  const confirmButton = dialogForm.querySelector('button.confirm');
  const customGiftInput = mainSection.querySelector('.custom-gift');

  if (productId) {
    dialogForm.elements.id.value = productId;
    dialogTitle.textContent = productName;
  } else {
    dialogForm.elements.id.value = 0;
    dialogTitle.textContent = 'Reservar presente';
  }

  dialogForm.elements.name.value = reservedBy;
  dialogForm.elements.name.disabled = !!reservedBy;

  customGiftInput.style.display = productId ? "none" : "";
  dialogForm.elements.customGift.hidden = !!productId;
  dialogForm.elements.customGift.required = !productId;
  deleteButton.hidden = reservationId !== localStorage.getItem("reservation-id");
  confirmButton.hidden = !deleteButton.hidden;

  dialog.showModal();
}

productAnother.addEventListener("click", () => {
  openReservationDialog();
});

availableProducts.forEach(elem => {
  elem.addEventListener('click', () => {
    const productId = parseInt(elem.dataset.productId);
    const reservationId = elem.dataset.reservationId;
    const productName = elem.querySelector('.name').textContent;
    const reservedBy = elem.querySelector('.owner>b')?.textContent;

    const ownReservationId = localStorage.getItem("reservation-id");
    if (ownReservationId && reservationId && reservationId !== ownReservationId) return;

    openReservationDialog(productId, productName, reservationId, reservedBy);
  });
});