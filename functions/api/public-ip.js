export async function onRequest(context) {
  const headers = Object.fromEntries(context.request.headers.entries());
  console.log('Request headers:', headers);

  const clientIP = context.request.headers.get('CF-Connecting-IP') || 
                  context.request.headers.get('X-Real-IP') || 
                  context.request.headers.get('X-Forwarded-For')?.split(',')[0];

  return new Response(JSON.stringify({
    success: true,
    ip: clientIP,
    debug: {
      headers: headers,
      cfIP: context.request.headers.get('CF-Connecting-IP'),
      realIP: context.request.headers.get('X-Real-IP'),
      forwardedFor: context.request.headers.get('X-Forwarded-For')
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
} 