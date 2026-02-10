// WeChat JS-SDK Signature Worker for Cloudflare

let tokenCache = { token: '', ticket: '', tokenExpire: 0, ticketExpire: 0 };

async function getAccessToken(env) {
  const now = Date.now();
  if (tokenCache.token && tokenCache.tokenExpire > now) {
    return tokenCache.token;
  }
  const resp = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${env.WX_APPID}&secret=${env.WX_APPSECRET}`
  );
  const data = await resp.json();
  if (data.access_token) {
    tokenCache.token = data.access_token;
    tokenCache.tokenExpire = now + (data.expires_in - 300) * 1000;
    return data.access_token;
  }
  throw new Error('access_token error: ' + JSON.stringify(data));
}

async function getJsApiTicket(env) {
  const now = Date.now();
  if (tokenCache.ticket && tokenCache.ticketExpire > now) {
    return tokenCache.ticket;
  }
  const token = await getAccessToken(env);
  const resp = await fetch(
    `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`
  );
  const data = await resp.json();
  if (data.ticket) {
    tokenCache.ticket = data.ticket;
    tokenCache.ticketExpire = now + (data.expires_in - 300) * 1000;
    return data.ticket;
  }
  throw new Error('jsapi_ticket error: ' + JSON.stringify(data));
}

async function sha1(str) {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/wx-sign') {
      const pageUrl = url.searchParams.get('url');
      if (!pageUrl) {
        return new Response(JSON.stringify({ error: 'Missing url param' }), { status: 400, headers: CORS });
      }
      try {
        const ticket = await getJsApiTicket(env);
        const nonceStr = Math.random().toString(36).substring(2, 15);
        const timestamp = Math.floor(Date.now() / 1000);
        const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${pageUrl}`;
        const signature = await sha1(raw);

        return new Response(JSON.stringify({
          appId: env.WX_APPID,
          timestamp,
          nonceStr,
          signature
        }), { headers: CORS });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
      }
    }

    return new Response(JSON.stringify({ status: 'ok', service: 'wx-sign' }), { headers: CORS });
  }
};
