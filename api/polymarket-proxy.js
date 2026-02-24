// Polymarket CLOB API Proxy — routes through Vercel edge to bypass US geoblock
// Security: requires X-Proxy-Key header

export const config = {
  runtime: 'edge',
  regions: ['cdg1', 'lhr1', 'arn1'], // Paris, London, Stockholm
};

export default async function handler(request) {
  const proxyKey = request.headers.get('X-Proxy-Key');
  if (proxyKey !== process.env.POLY_PROXY_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  // Path after /api/polymarket-proxy/ gets forwarded to clob.polymarket.com
  const targetPath = url.pathname.replace('/api/polymarket-proxy', '') || '/';
  const targetUrl = `https://clob.polymarket.com${targetPath}${url.search}`;

  // Forward all headers except host and our proxy key
  const headers = new Headers(request.headers);
  headers.delete('X-Proxy-Key');
  headers.delete('host');

  const init = {
    method: request.method,
    headers: headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  try {
    const response = await fetch(targetUrl, init);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
