export async function onRequest(context) {
  try {
    // 首先尝试从itdog获取IP
    const itdogResponse = await fetch('https://test.itdog.cn');
    const itdogData = await itdogResponse.json();
    
    if (itdogData && itdogData.type === 'success' && itdogData.ip) {
      return new Response(JSON.stringify({
        success: true,
        ip: itdogData.ip
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    // 如果itdog失败，尝试使用ipify
    const ipifyResponse = await fetch('https://api.ipify.org?format=json');
    const ipifyData = await ipifyResponse.json();
    
    if (ipifyData && ipifyData.ip) {
      return new Response(JSON.stringify({
        success: true,
        ip: ipifyData.ip
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    throw new Error('无法获取IP地址');
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '获取IP地址失败'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      status: 500
    });
  }
} 
