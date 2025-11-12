const pixBtn = document.querySelector("button.pix");
const productsList = document.querySelector("#products>.list");
const productAnother = productsList.querySelector(".another");
const availableProducts = productsList.querySelectorAll('div[data-product-id], div[data-reservation-id]');
const dialog = document.getElementById("reservation");
const dialogTitle = dialog?.querySelector("header>h4");
const dialogForm = dialog?.querySelector("form");
const dialogConfirmButton = dialog?.querySelector("button.confirm");
const dialogDeleteButton = dialog?.querySelector("button.delete");
const dialogCloseButton = dialog?.querySelector("button.cancel");
const dialogCancelButton = dialog?.querySelector("button.close");

let products = [];
let customGifts = [];
let currentProductElement = null;

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

      if (isOpen) {
        dialog.removeAttribute("inert");

        const firstInput = dialog.querySelector('input:not([disabled]):not([hidden])');
        if (firstInput) setTimeout(() => firstInput.focus(), 0);
      } else {
        dialog.setAttribute("inert", "");
      }

      document.body.style.overflow = isOpen ? "hidden" : "";
    }
  })
});

dialogAttrObserver.observe(dialog, {
  attributes: true,
});

dialogDeleteButton.addEventListener("click", async () => {
  const formData = Object.fromEntries(new FormData(dialogForm).entries());
  const reservationId = localStorage.getItem("reservation-id");

  if (!reservationId) {
    alert('Erro: ID de reserva não encontrado.');
    return;
  }

  dialog.inert = true;
  dialogDeleteButton.classList.add("loading");

  try {
    const response = await fetch('/api/unreserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reservationId,
        productId: formData.id ? parseInt(formData.id) : null,
      })
    });

    if (response.ok) {
      dialogForm.reset();
      dialog.close();

      if (currentProductElement && currentProductElement.classList.contains('custom')) {
        currentProductElement.remove();
      } else if (currentProductElement) {
        currentProductElement.classList.add("available");
        currentProductElement.removeAttribute("data-reservation-id");
        currentProductElement.querySelector(".owner>span").textContent = "Disponível ";
        currentProductElement.querySelector(".owner>b").textContent = "";
      }

      currentProductElement = null;

    } else if (response.status === 404) {
      alert('Reserva não encontrada.');
    } else if (response.status === 403) {
      alert('Você não tem permissão para remover esta reserva.');
    } else {
      alert('Erro ao remover reserva. Tente novamente.');
    }
  } catch (error) {
    console.error('Erro ao remover reserva:', error);
    alert('Erro ao remover reserva. Tente novamente.');
  }

  dialog.inert = false;
  dialogDeleteButton.classList.remove("loading");
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

      if (formData.id && parseInt(formData.id) > 0) {
        const prodElem = productsList.querySelector(`[data-product-id="${formData.id}"]`);
        if (prodElem) {
          prodElem.classList.remove("available");
          prodElem.dataset.reservationId = reservationId.substring(0, 8);
          prodElem.querySelector(".owner>span").textContent = "Reservado por";
          prodElem.querySelector(".owner>b").textContent = formData.name;
        }
      }

      if (!formData.id || parseInt(formData.id) === 0) {
        location.reload();
      }

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

function openReservationDialog(productId = null, productName = null, reservationId = "", reservedBy = "", productElement = null) {
  dialogForm.reset();

  const mainSection = dialogForm.querySelector('main');
  const deleteButton = dialogForm.querySelector('button.delete');
  const confirmButton = dialogForm.querySelector('button.confirm');
  const customGiftInput = mainSection.querySelector('.custom-gift');

  currentProductElement = productElement;

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
  dialogForm.elements.customGift.value = productName;
  dialogForm.elements.customGift.hidden = !!productId;
  dialogForm.elements.customGift.disabled = !!productId || !!reservedBy;
  dialogForm.elements.customGift.required = !productId;

  const ownReservationId = localStorage.getItem("reservation-id");
  const isOwnReservation = ownReservationId && reservationId && ownReservationId.startsWith(reservationId);

  deleteButton.hidden = !isOwnReservation;
  confirmButton.hidden = !!reservationId || !deleteButton.hidden;

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

    if (ownReservationId && reservationId && !ownReservationId.startsWith(reservationId)) return;
    else if (!ownReservationId && reservationId) return;

    openReservationDialog(productId, productName, reservationId, reservedBy, elem);
  });
});