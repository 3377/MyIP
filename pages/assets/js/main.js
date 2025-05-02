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
    `:</span><span class="${className}" onclick="copyIP('${value}', this)">` +
    value +
    '<span class="copy-tooltip">已复制!</span></span></div>'
  );
}

// 主题管理
function checkAndSetTheme() {
  // 检查本地存储中是否有用户设置的主题
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme) {
    // 如果用户手动设置过主题，则使用保存的主题
    setTheme(savedTheme);
  } else {
    // 否则根据当前北京时间自动设置主题
    const beijingHour = getBeiJingHour();
    const isDarkHours = beijingHour >= 18 || beijingHour < 8;
    setTheme(isDarkHours ? 'dark' : 'light');
  }
}

// 获取北京时间的小时数
function getBeiJingHour() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijingTime = new Date(utcTime + 8 * 3600000);
  return beijingTime.getHours();
}

// 设置主题
function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  
  // 更新主题切换按钮的图标
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '🌙' : '🌞';
  }
}

// 切换主题
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // 保存到本地存储
  localStorage.setItem('theme', newTheme);
  
  // 应用新主题
  setTheme(newTheme);
}

// 暴露给全局使用
window.toggleTheme = toggleTheme;

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

// 判断当前平台环境并返回正确的API基础URL
function getApiBaseUrl() {
  // 检测当前URL是否在腾讯EdgeOne Pages上
  if (window.location.hostname.includes('edgeone.site') || 
      window.location.hostname.includes('edgeone.app') || 
      window.location.hostname.includes('tencent-cloud.com')) {
    // 当在腾讯EdgeOne Pages上时，使用绝对路径
    return window.location.origin;
  }
  // 在Cloudflare Pages或其他环境下，使用相对路径
  return '';
}

// 获取IP信息
async function fetchIPInfo(ip) {
  if (!ip) {
    $("#result").html("IP地址无效。");
    return;
  }

  try {
    // 从百度API获取IP基础信息
    const response = await fetch(`https://qifu-api.baidubce.com/ip/geo/v1/district?ip=${ip}`);
    const data = await response.json();
    
    if (data.code === 'Success' && data.data) {
      // 转换百度API返回的数据格式
      const info = {
        continent: data.data.continent || '-',
        country: data.data.country || '-',
        prov: data.data.prov || '-',
        city: data.data.city || '-',
        district: data.data.district || '-',
        isp: data.data.isp || '-',
        lat: '-',
        lng: '-',
        owner: data.data.owner || '-',
        accuracy: '-',
        zipcode: data.data.zipcode || '-',
        adcode: data.data.adcode || '-'
      };

      // 显示基本数据
      displayResult(ip, info);
      
      try {
        // 获取API基础URL
        const apiBaseUrl = getApiBaseUrl();
        
        // 调用后端API获取所有位置信息（包括美团经纬度和位置信息）
        const locationResponse = await fetch(`${apiBaseUrl}/_api/all-location?` + new URLSearchParams({
          ip: ip
        }));
        
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          if (locationData.success) {
            // 更新经纬度信息
            info.lat = locationData.lat || '-';
            info.lng = locationData.lng || '-';
            info.accuracy = (info.lat !== '-' && info.lng !== '-') ? '高精度' : '低精度';
            
            // 更新显示
            displayResult(ip, info);

            // 更新位置信息
            if (locationData.locations) {
              updateLocationInfo(locationData.locations);
            }
          } else {
            console.error('位置信息API返回错误:', locationData);
          }
        } else {
          console.error('位置信息API请求失败:', locationResponse.status);
        }
      } catch (error) {
        console.error('获取位置信息失败:', error);
      }
    } else {
      console.error('百度API返回错误:', data);
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
      // 如果主API失败，使用后备方案
      // 获取API基础URL
      const apiBaseUrl = getApiBaseUrl();
      
      const backupResponse = await fetch(`${apiBaseUrl}/_api/public-ip`);
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
window.copyIP = function (text, element) {
  navigator.clipboard.writeText(text)
    .then(function () {
      // 隐藏所有其他的提示框
      document.querySelectorAll('.copy-tooltip').forEach(tip => {
        tip.style.display = 'none';
      });

      // 显示当前元素的提示框
      const tooltip = element.querySelector('.copy-tooltip');
      if (tooltip) {
        tooltip.style.display = 'block';
        
        // 1.5秒后自动隐藏
        setTimeout(() => {
          tooltip.style.display = 'none';
        }, 1500);
      }
    })
    .catch(function (err) {
      console.error("复制失败:", err);
      // 显示错误提示
      const tooltip = element.querySelector('.copy-tooltip');
      if (tooltip) {
        tooltip.textContent = '复制失败';
        tooltip.style.display = 'block';
        tooltip.style.background = 'rgba(220, 53, 69, 0.9)';
        setTimeout(() => {
          tooltip.style.display = 'none';
          tooltip.textContent = '已复制!';
          tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
        }, 1500);
      }
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
  // 设置主题
  checkAndSetTheme();
  
  // 每小时检查一次主题（处理自动切换）
  setInterval(function() {
    // 如果用户没有手动设置主题，则自动更新
    if (!localStorage.getItem('theme')) {
      const beijingHour = getBeiJingHour();
      const isDarkHours = beijingHour >= 18 || beijingHour < 8;
      setTheme(isDarkHours ? 'dark' : 'light');
    }
  }, 60 * 60 * 1000); // 每小时检查一次
  
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

// 修改位置信息获取数
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

// 初始化主题检查
document.addEventListener('DOMContentLoaded', function() {
  // 初始检查主题
  checkAndSetTheme();
  
  // 每分钟检查一次主题（考虑到性能，不需要每秒检查）
  setInterval(checkAndSetTheme, 60000);
}); 