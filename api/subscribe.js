// Vercel Serverless Function — recibe el correo desde la herramienta y lo guarda en Brevo.
// La API key vive SOLO aquí en el servidor (variable de entorno BREVO_API_KEY), nunca en el navegador.
//
// Variables de entorno que se configuran en Vercel:
//   BREVO_API_KEY  (obligatoria)  -> tu clave de Brevo (SMTP & API > API Keys)
//   BREVO_LIST_ID  (opcional)     -> ID de la lista; por defecto 3

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Vercel normalmente ya parsea JSON; por si acaso, lo cubrimos.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const email = (body && body.email || '').trim();
  const source = (body && body.source || '').toString().slice(0, 60);
  const focus = (body && body.focus || '').toString().slice(0, 120);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ error: 'invalid email' });
    return;
  }

  const KEY = process.env.BREVO_API_KEY;
  if (!KEY) {
    res.status(500).json({ error: 'server not configured (missing BREVO_API_KEY)' });
    return;
  }
  const LIST_ID = Number(process.env.BREVO_LIST_ID || 3);

  const send = (payload) =>
    fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  const base = { email, listIds: [LIST_ID], updateEnabled: true };
  const withAttrs = { ...base, attributes: { SOURCE: source, FOCUS: focus } };

  try {
    // Intento 1: con atributos SOURCE/FOCUS (si existen en Brevo, segmentas mejor).
    let r = await send(withAttrs);
    // Si Brevo rechaza por atributos no definidos, reintenta solo con email + lista.
    if (r.status === 400) {
      r = await send(base);
    }
    if (r.ok || r.status === 204) {
      res.status(200).json({ ok: true });
      return;
    }
    const detail = await r.text();
    res.status(502).json({ error: 'brevo', status: r.status, detail: detail.slice(0, 300) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
