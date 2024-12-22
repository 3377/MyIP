export async function onRequest(context) {
  // 获取访问者IP
  const clientIP = context.request.headers.get('cf-connecting-ip') || 
                  context.request.headers.get('x-real-ip') || 
                  context.request.headers.get('x-forwarded-for')?.split(',')[0];

  // 检查是否是内部请求（来自同一 Cloudflare Pages 项目）
  const isInternalRequest = context.request.headers.get('CF-Worker') !== null || 
                           context.request.headers.get('CF-Ray') !== null ||
                           context.request.headers.get('Host')?.includes('.pages.dev');

  // 获取允许的IP和域名列表
  const allowedIPs = (context.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
  const allowedDomains = (context.env.ALLOWED_DOMAINS || '').split(',').map(domain => domain.trim()).filter(Boolean);
  
  // 检查是否来自允许的域名
  const referer = context.request.headers.get('referer');
  const isAllowedDomain = referer && allowedDomains.some(domain => referer.includes(domain));

  // 检查是否是允许的IP
  const isAllowedIP = allowedIPs.includes(clientIP);

  // 如果不是内部请求且不是允许的IP或域名，检查访问次数
  if (!isInternalRequest && !isAllowedIP && !isAllowedDomain) {
    // 使用 Cache API 获取临时访问记录
    const cacheKey = `access_count:${clientIP}`;
    const cache = caches.default;
    let accessCount = 0;

    try {
      const cacheResponse = await cache.match(cacheKey);
      if (cacheResponse) {
        accessCount = parseInt(await cacheResponse.text());
      } else {
        // 如果缓存中没有，检查 KV
        const namespace = context.env.IP_ACCESS_KV;
        if (namespace) {
          const stored = await namespace.get(clientIP);
          if (stored) {
            accessCount = parseInt(stored);
          }
        }
      }

      // 增加访问次数
      accessCount++;

      // 如果访问次数超过3次，返回未授权信息
      if (accessCount > 3) {
        // 将超过限制的IP存入KV
        if (context.env.IP_ACCESS_KV) {
          try {
            await context.env.IP_ACCESS_KV.put(clientIP, accessCount.toString(), {
              expirationTtl: 86400 // 24小时后过期
            });
          } catch (error) {
            console.error('更新KV访问次数失败:', error);
          }
        }

        return new Response(JSON.stringify({
          success: false,
          message: '您未授权使用此API，需要使用请联系QQ35794406'
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 更新缓存中的访问次数（3次以内）
      const cacheResponse = new Response(accessCount.toString());
      const cacheOptions = {
        expirationTtl: 86400, // 24小时后过期
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      };
      await cache.put(cacheKey, cacheResponse.clone());

    } catch (error) {
      console.error('访问控制处理失败:', error);
    }
  }

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

    // 初始化位置信息
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

    if (!tencentKey) {
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

    const qqMapResponse = await fetch(
      `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${tencentKey}&get_poi=0`
    );
    const qqMapData = await qqMapResponse.json();

    let recommend = '-';
    let standard_address = '-';

    if (qqMapData.status === 0 && qqMapData.result) {
      recommend = qqMapData.result.formatted_addresses?.recommend || 
                  qqMapData.result.formatted_addresses?.rough || 
                  qqMapData.result.address || '-';
                  
      standard_address = qqMapData.result.address_component ? 
        `${qqMapData.result.address_component.province || ''}${qqMapData.result.address_component.city || ''}${qqMapData.result.address_component.district || ''}${qqMapData.result.address_component.street || ''}${qqMapData.result.address_component.street_number || ''}` : 
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