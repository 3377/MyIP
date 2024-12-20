export async function onRequest(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return new Response(JSON.stringify({
        success: false,
        message: '经纬度参数不能为空'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        status: 400
      });
    }

    // 从环境变量获取腾讯地图API密钥
    const apiKey = context.env.TENCENT_MAP_KEY;
    if (!apiKey) {
      throw new Error('腾讯地图API密钥未配置');
    }

    // 调用腾讯地图API
    const response = await fetch(
      `https://apis.map.qq.com/ws/geocoder/v1?location=${lat},${lng}&key=${apiKey}&get_poi=0`
    );
    
    const data = await response.json();
    
    if (data.status === 0) {
      return new Response(JSON.stringify({
        status: 0,
        recommend: data.result.formatted_addresses?.recommend || "-",
        standard_address: data.result.formatted_addresses?.standard_address || "-"
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    throw new Error(data.message || '获取位置信息失败');
  } catch (error) {
    return new Response(JSON.stringify({
      status: 1,
      message: error.message || '获取位置信息失败'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      status: 500
    });
  }
} 