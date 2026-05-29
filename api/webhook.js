export default async function handler(req, res) {
  // Siempre responder 200 primero para que Shopify no reintente
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  try {
    const order = req.body || {};

    const nombre = order.shipping_address?.name || order.billing_address?.name || order.customer?.first_name || 'Cliente';
    const direccion = formatDireccion(order.shipping_address || order.billing_address);
    const telefono = order.shipping_address?.phone || order.billing_address?.phone || order.phone || order.customer?.phone || 'Sin telefono';
    const email = order.email || order.customer?.email || 'Sin email';
    const orderNumber = order.order_number || order.name || order.id || 'S/N';

    const productos = (order.line_items || []).map(item => {
      const qty = item.quantity > 1 ? ' x' + item.quantity : '';
      return '- ' + (item.name || item.title || 'Producto') + qty;
    }).join('\n') || '- (ver pedido en Shopify)';

    const total = order.total_price
      ? '$' + Number(order.total_price).toLocaleString('es-CL') + ' CLP'
      : 'Por confirmar';

    const mensajeCliente = 'Hola ' + nombre.split(' ')[0] + ' Te escribimos de Punto Mercado para confirmar tu pedido\n\n' +
      'Nombre: ' + nombre + '\n' +
      'Direccion: ' + direccion + '\n' +
      'Telefono: ' + telefono + '\n' +
      'Email: ' + email + '\n\n' +
      'Producto(s):\n' + productos + '\n\n' +
      'Total: ' + total + '\n\n' +
      'Confirma tus datos y coordinamos la entrega';

    const mensajeBot = 'Nuevo pedido #' + orderNumber + '\n\n' +
      nombre + '\n' + telefono + '\n\n' +
      '-----------------\n' +
      'BORRADOR PARA EL CLIENTE:\n' +
      '-----------------\n\n' +
      mensajeCliente;

    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    await fetch(
      'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: mensajeBot }),
      }
    );

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true });
  }
}

function formatDireccion(addr) {
  if (!addr) return 'Sin direccion';
  return [addr.address1, addr.address2, addr.city, addr.province].filter(Boolean).join(', ');
}
