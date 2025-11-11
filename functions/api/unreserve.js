export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { reservationId, productId } = body;

    if (!reservationId) {
      return new Response(null, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Se for um presente customizado
    if (!productId || productId === 0) {
      const customGiftsJson = await env.RESERVATIONS.get("custom_gifts");
      const customGifts = customGiftsJson ? JSON.parse(customGiftsJson) : [];

      const giftIndex = customGifts.findIndex(gift => gift.reservationId === reservationId);

      if (giftIndex === -1) {
        return new Response(null, {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      customGifts.splice(giftIndex, 1);
      await env.RESERVATIONS.put("custom_gifts", JSON.stringify(customGifts));

      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Se for um produto da lista
    const reservationsJson = await env.RESERVATIONS.get("reservations");
    const reservations = reservationsJson ? JSON.parse(reservationsJson) : {};

    if (!reservations[productId]) {
      return new Response(null, {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Verifica se a reserva pertence ao usuário
    if (reservations[productId].reservationId !== reservationId) {
      return new Response(null, {
        status: 403,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    delete reservations[productId];

    await env.RESERVATIONS.put("reservations", JSON.stringify(reservations));

    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(null, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
