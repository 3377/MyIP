// Unicode解码辅助函数
function decodeUnicode(str) {
  try {
    return str.replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
  } catch (error) {
    return str;
  }
}

// 并行调用新API获取额外信息
async function fetchAdditionalInfo(ip) {
  try {
    const [overseasResponse, ipv6Response] = await Promise.allSettled([
      fetch('https://ipv4-overseas.itdog.plus/'),
      fetch('https://ipv6.itdog.cn/')
    ]);

    let zipcode = "-";
    let adcode = "-";

    // 处理出国IP信息
    if (overseasResponse.status === 'fulfilled' && overseasResponse.value.ok) {
      const overseasData = await overseasResponse.value.json();
      if (overseasData.type === 'success' && overseasData.address) {
        zipcode = decodeUnicode(overseasData.address);
      }
    }

    // 处理IPv6信息
    if (ipv6Response.status === 'fulfilled' && ipv6Response.value.ok) {
      const ipv6Data = await ipv6Response.value.json();
      if (ipv6Data.type === 'success' && ipv6Data.address) {
        adcode = decodeUnicode(ipv6Data.address);
      }
    }

    return { zipcode, adcode };
  } catch (error) {
    console.error('获取额外信息失败:', error);
    return { zipcode: "-", adcode: "-" };
  }
}

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
      // 并行获取额外信息
      const additionalInfo = await fetchAdditionalInfo(ip);
      
      return new Response(JSON.stringify({
        success: true,
        info: {
          continent: data.continent?.name || "亚洲",
          country: data.country?.name || "中国",
          zipcode: additionalInfo.zipcode, // 出国IP信息
          owner: data.as?.name || "-",
          isp: data.as?.info || "-",
          adcode: additionalInfo.adcode, // IPv6地址信息
          lat: data.location?.latitude || "-",
          lng: data.location?.longitude || "-",
          prov: data.regions?.[0] || "-",
          city: data.regions?.[1] || "-",
          district: data.regions?.[2] || "-",
          accuracy: data.location?.latitude && data.location?.longitude ? "高精度" : "低精度"
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