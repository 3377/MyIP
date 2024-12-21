// 工具函数
function createInfoItem(label, value) {
  // 如果value已经是HTML字符串（包含span标签），则直接使用
  if (typeof value === 'string' && value.includes('<span')) {
    const spanValue = value.replace('<span', '<span class="info-value"');
    return (
      '<div class="info-row"><span class="info-label">' +
      label +
      ':</span>' +
      spanValue +
      "</div>"
    );
  }
  // 否则，为value添加可点击复制功能
  const className = label === "您的IP" ? "ip-value info-value" : "copyable-value info-value";
  return (
    '<div class="info-row"><span class="info-label">' +
    label +
    `:</span><span class="${className}" onclick="window.copyIP('${value}')">` +
    value +
    '<span class="copy-tooltip">已复制!</span></span></div>'
  );
}

// 加载访问统计
function loadBusuanziScript() {
  $.getScript(
    "//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js",
    function () {
      setTimeout(function () {
        if ($("#busuanzi_value_site_pv").text() === "") {
          $("#busuanzi_value_site_pv").text("无法获取");
        }
        if ($("#busuanzi_value_site_uv").text() === "") {
          $("#busuanzi_value_site_uv").text("无法获取");
        }
      }, 3000);
    }
  );
}

// 显示结果
async function displayResult(ip, info) {
  $("#result").empty();

  var content = "";
  content += createInfoItem("您的IP", ip);
  content += createInfoItem("洲别", info.continent || "-");
  content += createInfoItem("国家", info.country || "-");
  content += createInfoItem("邮编", info.zipcode || "-");
  content += createInfoItem("时区", "UTC+8");
  content += createInfoItem("精度", info.accuracy || "-");
  content += createInfoItem("所有者", info.owner || "-");
  content += createInfoItem("ISP", info.isp || "-");
  content += createInfoItem("行政码", info.adcode || "-");
  content += createInfoItem("纬度", info.lat || "-");
  content += createInfoItem("经度", info.lng || "-");
  content += createInfoItem("省份", info.prov || "-");
  content += createInfoItem("城市", info.city || "-");
  content += createInfoItem("区县", info.district || "-");
  content += createInfoItem("位置A", info.locationA || "正在获取...");
  content += createInfoItem("位置B", info.locationB || "正在获取...");
  content += createInfoItem("位置C", info.locationC || "正在获取...");
  content += createInfoItem("位置D", info.locationD || "正在获取...");
  content += createInfoItem("北京时间", '<span id="beijingTime"></span>');
  content += createInfoItem("UTC时间", '<span id="utcTime"></span>');
  content += createInfoItem("美东时间", '<span id="usTime"></span>');
  content += createInfoItem(
    "访问总数",
    '<span id="busuanzi_value_site_pv">-</span>'
  );
  content += createInfoItem(
    "访客总数",
    '<span id="busuanzi_value_site_uv">-</span>'
  );

  $("#result").html(content);
  loadBusuanziScript();

  // 更新时间显示
  updateTime();
  if (window.timeInterval) {
    clearInterval(window.timeInterval);
  }
  window.timeInterval = setInterval(updateTime, 1000);

  // 如果有经纬度信息，获取位置信息
  if (info.lat && info.lng) {
    try {
      const locationInfo = await fetchLocationInfo(info.lat, info.lng);
      if (locationInfo.status === 0) {
        updateLocationInfo(locationInfo);
      } else {
        // 更新位置信息为错误状态
        updateLocationError();
      }
    } catch (error) {
      console.error('获取位置信息失败:', error);
      updateLocationError();
    }
  }
}

// 更新位置信息
function updateLocationInfo(locationInfo) {
  $(".info-row").each(function () {
    const label = $(this).find(".info-label").text().trim();
    if (label === "位置A:") {
      $(this)
        .find(".info-value")
        .text(locationInfo.locationA || "-");
    } else if (label === "位置B:") {
      $(this)
        .find(".info-value")
        .text(locationInfo.locationB || "-");
    } else if (label === "位置C:") {
      const address = locationInfo.recommend || "-";
      $(this)
        .find(".info-value")
        .removeClass("copyable-value")
        .addClass("copyable-value")
        .attr("onclick", `window.copyIP('${address}')`)
        .html(address + '<span class="copy-tooltip">已复制!</span>');
    } else if (label === "位置D:") {
      const standardAddress = locationInfo.standard_address || "-";
      $(this)
        .find(".info-value")
        .removeClass("copyable-value")
        .addClass("copyable-value")
        .attr("onclick", `window.copyIP('${standardAddress}')`)
        .html(standardAddress + '<span class="copy-tooltip">已复制!</span>');
    }
  });
}

// 获取IP信息
async function fetchIPInfo(ip) {
  if (!ip) {
    $("#result").html("IP地址无效。");
    return;
  }

  try {
    // 先从后端API获取经纬度信息（美团第一个API）
    const geoResponse = await fetch('/_api/ip-geo?' + new URLSearchParams({
      ip: ip
    }));
    
    if (!geoResponse.ok) {
      throw new Error('获取地理位置信息失败');
    }

    const geoData = await geoResponse.json();
    
    // 从百度API获取IP基础信息
    const response = await fetch(`https://qifu-api.baidubce.com/ip/geo/v1/district?ip=${ip}`);
    const data = await response.json();
    
    if (data.code === 0 && data.data) {
      // 合并百度API和美团API的数据
      const info = {
        continent: data.data.continent || '-',
        country: data.data.country || '-',
        prov: data.data.prov || '-',
        city: data.data.city || '-',
        district: data.data.district || '-',
        isp: data.data.isp || '-',
        lat: geoData.success ? geoData.lat : (data.data.location?.lat || '-'),
        lng: geoData.success ? geoData.lng : (data.data.location?.lng || '-'),
        owner: data.data.owner || '-',
        accuracy: data.data.accuracy || '-',
        zipcode: data.data.zipcode || '-',
        adcode: data.data.adcode || '-'
      };
      
      displayResult(ip, info);

      // 获取位置详细信息
      if (info.lat && info.lng) {
        try {
          const locationResponse = await fetch('/_api/location?' + new URLSearchParams({
            ip: ip,
            lat: info.lat,
            lng: info.lng
          }));
          
          if (locationResponse.ok) {
            const locationData = await locationResponse.json();
            if (locationData.status === 0) {
              updateLocationInfo(locationData);
            }
          }
        } catch (error) {
          console.error('获取位置信息失败:', error);
        }
      }
    } else {
      $("#result").html(data.message || "获取IP信息失败。");
    }
  } catch (error) {
    console.error('获取IP信息失败:', error);
    $("#result").html("获取IP信息失败，请稍后重试。");
  }
}

// 获取公网IP
async function fetchPublicIP() {
  try {
    const response = await fetch('https://ipv4_cm.itdog.cn');
    const data = await response.json();
    
    if (data.type === 'success' && data.ip) {
      fetchIPInfo(data.ip);
    } else {
      // 如果主API失败，才使用后备方案
      const backupResponse = await fetch('/_api/public-ip');
      const backupData = await backupResponse.json();
      
      if (backupData.success && backupData.ip) {
        fetchIPInfo(backupData.ip);
      } else {
        $("#result").html("无法获取公网IP地址。");
      }
    }
  } catch (error) {
    console.error('获取公网IP失败:', error);
    $("#result").html("获取IP失败，请稍后重试。");
  }
}

// 时间相关函数
function updateTime() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;

  // 北京时间 (UTC+8)
  const beijingTime = new Date(utcTime + 8 * 3600000);
  $("#beijingTime").text(formatDate(beijingTime));

  // UTC时间
  const utc = new Date(utcTime);
  $("#utcTime").text(formatDate(utc));

  // 美东时间 (UTC-4/UTC-5)
  const usOffset = isDST() ? -4 : -5;
  const usTime = new Date(utcTime + usOffset * 3600000);
  $("#usTime").text(formatDate(usTime));
}

function isDST() {
  const today = new Date();
  const year = today.getFullYear();
  const march = new Date(year, 2, 1);
  const november = new Date(year, 10, 1);

  const secondSundayInMarch = new Date(march.setDate(14 - march.getDay()));
  const firstSundayInNovember = new Date(november.setDate(7 - november.getDay()));

  return today >= secondSundayInMarch && today < firstSundayInNovember;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  if (window.innerWidth <= 768) {
    return `${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 复制功能
window.copyIP = function (text) {
  navigator.clipboard.writeText(text)
    .then(function () {
      const tooltip = $(".ip-value .copy-tooltip");
      tooltip.fadeIn(200);
      setTimeout(() => {
        tooltip.fadeOut(200);
      }, 1500);
    })
    .catch(function (err) {
      console.error("复制失败:", err);
    });
};

// 搜索功能
window.showSearchInput = function () {
  $("#searchBox").slideDown(200);
  $("#ipInput").focus();

  setTimeout(() => {
    $(document).on("click.searchbox", function (e) {
      const ip = $("#ipInput").val().trim();

      if (
        !$(e.target).closest("#ipInput").length &&
        !$(e.target).closest(".fa-search").length
      ) {
        if (ip) {
          executeIPQuery(ip);
        } else {
          $("#searchBox").slideUp(200);
        }
        $(document).off("click.searchbox");
      }
    });
  }, 0);
};

function executeIPQuery(ip) {
  $("#result").html(`
    <div class="loading">
      <div>
        <div class="spinner-border text-primary mb-2" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <div>正在查询IP相关信息...</div>
      </div>
    </div>
  `);

  if (window.timeInterval) {
    clearInterval(window.timeInterval);
  }

  $("#searchBox").slideUp(200);
  $("#ipInput").val("");
  fetchIPInfo(ip);
}

// 初始化
$(document).ready(function () {
  $("#ipInput").on("keypress", function (e) {
    if (e.which === 13) {
      const ip = $(this).val().trim();
      if (ip) {
        executeIPQuery(ip);
      }
    }
  });

  fetchPublicIP();
});

// 修改位置信息获取函数
async function fetchLocationInfo(lat, lng) {
  if (!lat || !lng || lat === '-' || lng === '-') {
    return { 
      status: 1, 
      message: '无效的经纬度信息'
    };
  }

  try {
    // 使用腾讯地图API获取详细位置信息
    const key = window.TENCENT_MAP_KEY;
    const response = await fetch(`https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${key}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.status === 0) {
      return {
        status: 0,
        recommend: data.result.formatted_addresses?.recommend || data.result.address,
        standard_address: data.result.address_component ? 
          `${data.result.address_component.province}${data.result.address_component.city}${data.result.address_component.district}${data.result.address_component.street}${data.result.address_component.street_number}` : 
          data.result.address
      };
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('获取位置信息失败:', error);
    return { 
      status: 1, 
      message: error.message 
    };
  }
}

// 添加错误处理函数
function updateLocationError() {
  const errorMsg = "位置信息获取失败";
  $(".info-row").each(function () {
    const label = $(this).find(".info-label").text().trim();
    if (label === "位置C:" || label === "位置D:") {
      $(this).find(".info-value").text(errorMsg);
    }
  });
} 