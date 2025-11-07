export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { reservationId, productId, fullName, customGift } = body;

    if (!reservationId || !fullName || fullName.trim().length < 3) {
      return new Response(null, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (customGift) {
      if (!customGift.trim()) {
        return new Response(null, {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const customGiftsJson = await env.RESERVATIONS.get("custom_gifts");
      const customGifts = customGiftsJson ? JSON.parse(customGiftsJson) : [];

      const newGift = {
        id: `custom-${Date.now()}`,
        gift: customGift.replace(/\W\s/g, "").trim(),
        reservationId,
        reservedBy: fullName.replace(/\W\s/g, "").trim(),
        timestamp: new Date().toISOString()
      };

      customGifts.push(newGift);
      await env.RESERVATIONS.put("custom_gifts", JSON.stringify(customGifts));

      return new Response(null, {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!productId) {
      return new Response(null, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const reservationsJson = await env.RESERVATIONS.get("reservations");
    const reservations = reservationsJson ? JSON.parse(reservationsJson) : {};

    if (reservations[productId]) {
      return new Response(null, {
        status: 409,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    reservations[productId] = {
      reservationId,
      reservedBy: fullName.replace(/\W\s/g, "").trim(),
      timestamp: new Date().toISOString()
    };

    await env.RESERVATIONS.put("reservations", JSON.stringify(reservations));

    return new Response(null, {
      status: 201,
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
