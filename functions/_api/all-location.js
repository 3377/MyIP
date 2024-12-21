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
    const qqMapResponse = await fetch(
      `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${tencentKey}`
    );
    const qqMapData = await qqMapResponse.json();

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
      recommend = qqMapData.result.formatted_addresses?.recommend || qqMapData.result.address || '-';
      standard_address = qqMapData.result.address_component ? 
        `${qqMapData.result.address_component.province}${qqMapData.result.address_component.city}${qqMapData.result.address_component.district}${qqMapData.result.address_component.street}${qqMapData.result.address_component.street_number}` : 
        qqMapData.result.address || '-';
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