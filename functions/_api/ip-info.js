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

    // 调用百度API获取IP信息
    const response = await fetch(`https://qifu-api.baidubce.com/ip/geo/v1/district?ip=${ip}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.code === 'Success') {
      return new Response(JSON.stringify({
        success: true,
        info: {
          continent: data.data.continent || "亚洲",
          country: data.data.country || "中国",
          zipcode: data.data.zipcode || "-",
          owner: data.data.owner || "-",
          isp: data.data.isp || "-",
          adcode: data.data.adcode || "-",
          lat: data.data.lat || "-",
          lng: data.data.lng || "-",
          prov: data.data.prov || "-",
          city: data.data.city || "-",
          district: data.data.district || "-",
          accuracy: data.data.accuracy || "-"
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    throw new Error(data.message || '获取IP信息失败');
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