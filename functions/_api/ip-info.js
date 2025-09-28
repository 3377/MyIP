
export async function onRequest(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return new Response(JSON.stringify({
        success: false,
        message: 'IP地址不能为空'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        status: 400
      });
    }

    // 调用新API获取IP信息
    const response = await fetch(`https://drfy-ip.hf.space/${ip}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.ip) {
      return new Response(JSON.stringify({
        success: true,
        info: {
          continent: data.continent?.name || "亚洲",
          country: data.country?.name || "中国",
          isp: data.as?.info || "-",
          lat: data.location?.latitude || "-",
          lng: data.location?.longitude || "-",
          prov: data.regions?.[0] || "-",
          city: data.regions?.[1] || "-",
          district: data.regions?.[2] || "-"
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    throw new Error('获取IP信息失败');
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message || '获取IP信息失败'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      status: 500
    });
  }
} 