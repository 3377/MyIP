export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const ip = searchParams.get('ip');

  if (!ip) {
    return new Response(JSON.stringify({
      success: false,
      message: 'IP参数缺失'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // 1. 获取美团经纬度
    const mtLocResponse = await fetch(`https://apimobile.meituan.com/locate/v2/ip/loc?ip=${ip}`);
    const mtLocData = await mtLocResponse.json();

    if (!mtLocData.data || !mtLocData.data.lat || !mtLocData.data.lng) {
      return new Response(JSON.stringify({
        success: false,
        message: '无法获取经纬度信息'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const lat = mtLocData.data.lat.toFixed(6);
    const lng = mtLocData.data.lng.toFixed(6);

    // 2. 获取美团街道信息 (tag=0)
    const mtStreet0Response = await fetch(
      `https://apimobile.meituan.com/group/v1/city/latlng/${lat},${lng}?tag=0`
    );
    const mtStreet0Data = await mtStreet0Response.json();

    // 3. 获取美团街道信息 (tag=1)
    const mtStreet1Response = await fetch(
      `https://apimobile.meituan.com/group/v1/city/latlng/${lat},${lng}?tag=1`
    );
    const mtStreet1Data = await mtStreet1Response.json();

    // 4. 获取腾讯地图信息
    const tencentKey = context.env.TENCENT_MAP_KEY;
    console.log('腾讯地图API密钥:', tencentKey);

    if (!tencentKey) {
      console.error('腾讯地图API密钥未配置');
      return new Response(JSON.stringify({
        success: true,
        lat,
        lng,
        locations: {
          locationA,
          locationB,
          recommend: '腾讯地图API密钥未配置',
          standard_address: '腾讯地图API密钥未配置'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 输出更多调试信息
    console.log('准备调用腾讯地图API，参数:', {
      lat,
      lng,
      key: tencentKey ? '已配置' : '未配置',
      url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${tencentKey}&get_poi=0`
    });

    const qqMapResponse = await fetch(
      `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${tencentKey}&get_poi=0`
    );
    const qqMapData = await qqMapResponse.json();

    console.log('腾讯地图API返回:', qqMapData);

    // 5. 整合所有信息
    const locationA = mtStreet0Data.data ? 
      (mtStreet0Data.data.areaName && mtStreet0Data.data.detail ? 
        `${mtStreet0Data.data.areaName}-${mtStreet0Data.data.detail}` : 
        mtStreet0Data.data.areaName || mtStreet0Data.data.detail || '-') : 
      '-';

    const locationB = mtStreet1Data.data ? 
      (mtStreet1Data.data.areaName && mtStreet1Data.data.detail ? 
        `${mtStreet1Data.data.areaName}-${mtStreet1Data.data.detail}` : 
        mtStreet1Data.data.areaName || mtStreet1Data.data.detail || '-') : 
      '-';

    let recommend = '-';
    let standard_address = '-';

    if (qqMapData.status === 0 && qqMapData.result) {
      recommend = qqMapData.result.formatted_addresses?.recommend || 
                  qqMapData.result.formatted_addresses?.rough || 
                  qqMapData.result.address || '-';
                  
      standard_address = qqMapData.result.address_component ? 
        `${qqMapData.result.address_component.province || ''}${qqMapData.result.address_component.city || ''}${qqMapData.result.address_component.district || ''}${qqMapData.result.address_component.street || ''}${qqMapData.result.address_component.street_number || ''}` : 
        qqMapData.result.address || '-';
    } else {
      console.error('腾讯地图API返回错误:', qqMapData);
      recommend = '获取位置信息失败';
      standard_address = '获取位置信息失败';
    }

    return new Response(JSON.stringify({
      success: true,
      lat,
      lng,
      locations: {
        locationA,
        locationB,
        recommend,
        standard_address
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 