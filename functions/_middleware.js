const products = [
  { id: 1, name: "Ferro", image: "/images/products/ferro.jpg" },
  { id: 2, name: "Tanquinho", image: "/images/products/tanquinho.png" },
  { id: 3, name: "Fogão", image: "/images/products/fogao.jpg" },
  { id: 4, name: "Batedeira", image: "/images/products/batedeira.webp" },
  { id: 5, name: "Panela de pressão", image: "/images/products/panela-pressao.webp" },
  { id: 6, name: "Copos", image: "/images/products/copos.webp" },
  { id: 7, name: "Garrafa de café", image: "/images/products/garrafa-cafe.webp" },
  { id: 8, name: "Bule", image: "/images/products/bule.webp" },
  { id: 9, name: "Garrafa de água", image: "/images/products/garrafa-agua.webp" },
  { id: 10, name: "Tabuleiros", image: "/images/products/tabuleiros.webp" },
  { id: 11, name: "Jarra", image: "/images/products/jarra.webp" },
  { id: 12, name: "Pratos", image: "/images/products/pratos.webp" },
  { id: 13, name: "Facas", image: "/images/products/facas.webp" },
  { id: 14, name: "Vasilhas de plástico", image: "/images/products/vasilhas-plastico.webp" },
  { id: 15, name: "Garfo e colher", image: "/images/products/garfo-colher.webp" },
  { id: 16, name: "Colher de sobremesa", image: "/images/products/colher-sobremesa.webp" },
  { id: 17, name: "Colher de arroz", image: "/images/products/colher-arroz.webp" },
  { id: 18, name: "Jogo de sobremesa", image: "/images/products/jogo-sobremesa.webp" },
  { id: 19, name: "Jogo de xícara", image: "/images/products/jogo-xicara.webp" },
  { id: 20, name: "Amassador de alho", image: "/images/products/amassador-alho.webp" },
  { id: 21, name: "Lixeira para banheiro", image: "/images/products/lixeira-banheiro.webp" },
  { id: 22, name: "Lixeira para pia", image: "/images/products/lixeira-pia.webp" },
  { id: 23, name: "Escorredor de massas", image: "/images/products/escorredor-massas.webp" },
  { id: 24, name: "Travessas", image: "/images/products/travessas.webp" },
  { id: 25, name: "Colher (conchas)", image: "/images/products/conchas.webp" },
  { id: 26, name: "Escorredor de talher e louças", image: "/images/products/escorredor-talheres.webp" },
  { id: 27, name: "Panela pipoqueira", image: "/images/products/panela-pipoqueira.webp" },
  { id: 28, name: "Jogo de talheres", image: "/images/products/jogo-talheres.webp" },
  { id: 29, name: "Sanduicheira", image: "/images/products/sanduicheira.webp" },
  { id: 30, name: "Processador de alimentos", image: "/images/products/processador-alimentos.webp" },
  { id: 31, name: "Liquidificador", image: "/images/products/liquidificador.webp" },
];

class ProductInjector {
  constructor(reservations, customGifts) {
    this.reservations = reservations;
    this.customGifts = customGifts;
    this.injected = false;
  }

  element(element) {
    if (!this.injected) {
      // Separa produtos disponíveis e reservados
      const availableProducts = [];
      const reservedProducts = [];

      products.forEach(product => {
        const reservation = this.reservations[product.id];
        const isAvailable = !reservation;

        if (isAvailable) {
          availableProducts.push(product);
        } else {
          reservedProducts.push(product);
        }
      });

      // Renderiza primeiro os disponíveis, depois os reservados
      [...availableProducts, ...reservedProducts].forEach(product => {
        const reservation = this.reservations[product.id];
        const reservationId = reservation?.reservationId;
        // Retorna apenas os primeiros 8 caracteres do reservationId para segurança
        const partialReservationId = reservationId ? reservationId.substring(0, 8) : null;
        const isAvailable = !reservation;
        const availableClass = isAvailable ? ' class="available"' : '';
        const availableReservation = !isAvailable ? ` data-reservation-id="${partialReservationId}"` : '';

        const productHTML = `
          <div${availableClass} data-product-id="${product.id}"${availableReservation}>
            <img class="icon" src="${product.image}" alt="${product.name}" />
            <div class="infos">
              <span class="name">${product.name}</span>
              <span class="owner">
                <span>${isAvailable ? 'Disponível' : 'Reservado por'} </span>
                <b>${reservation?.reservedBy || ""}</b>
              </span>
            </div>
          </div>
        `;

        element.before(productHTML, { html: true });
      });

      this.customGifts.forEach(gift => {
        // Retorna apenas os primeiros 8 caracteres do reservationId para segurança
        const partialReservationId = gift.reservationId ? gift.reservationId.substring(0, 8) : null;
        const customGiftHTML = `
          <div class="custom" data-reservation-id="${partialReservationId}">
            <img class="icon" src="/images/gift-border.svg" />
            <div class="infos">
              <span class="name">${gift.gift}</span>
              <span class="owner">
                <span>Reservado por </span>
                <b>${gift.reservedBy}</b>
              </span>
            </div>
          </div>
        `;

        element.before(customGiftHTML, { html: true });
      });

      this.injected = true;
    }
  }
}

export async function onRequest(context) {
  const response = await context.next();

  if (response.headers.get('content-type')?.includes('text/html')) {
    const reservationsJson = await context.env.RESERVATIONS.get("reservations");
    const reservations = reservationsJson ? JSON.parse(reservationsJson) : {};

    const customGiftsJson = await context.env.RESERVATIONS.get("custom_gifts");
    const customGifts = customGiftsJson ? JSON.parse(customGiftsJson) : [];

    const rewriter = new HTMLRewriter()
      .on('.list > .another', new ProductInjector(reservations, customGifts));

    const transformedResponse = rewriter.transform(response);

    const newHeaders = new Headers(transformedResponse.headers);
    newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    newHeaders.set('Pragma', 'no-cache');
    newHeaders.set('Expires', '0');

    return new Response(transformedResponse.body, {
      status: transformedResponse.status,
      statusText: transformedResponse.statusText,
      headers: newHeaders
    });
  }

  return response;
}
