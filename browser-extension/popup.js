const STORAGE_KEY = '618_price_data';
const COMPARISON_URL = 'http://localhost:8080';

const platformIcons = {
  taobao: '🛒',
  tmall: '🏪',
  jd: '📦',
  pinduoduo: '💰',
  suning: '📺',
  youzan: '🏬'
};

const platformNames = {
  taobao: '淘宝',
  tmall: '天猫',
  jd: '京东',
  pinduoduo: '拼多多',
  suning: '苏宁',
  youzan: '有赞'
};

document.addEventListener('DOMContentLoaded', loadData);

async function loadData() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY] || {};

  const hasData = Object.keys(data).length > 0;

  document.getElementById('noData').style.display = hasData ? 'none' : 'block';
  document.getElementById('platformList').style.display = hasData ? 'flex' : 'none';
  document.getElementById('actions').style.display = hasData ? 'flex' : 'none';

  if (hasData) {
    renderPlatformList(data);
  }
}

function renderPlatformList(data) {
  const container = document.getElementById('platformList');
  container.innerHTML = '';

  for (const [platform, info] of Object.entries(data)) {
    const item = document.createElement('div');
    item.className = `platform-item active`;
    item.innerHTML = `
      <div class="platform-icon">${platformIcons[platform] || '📦'}</div>
      <div class="platform-info">
        <div class="platform-name">${info.platformName || platformNames[platform] || platform}</div>
        <div class="platform-price">¥${info.price?.toFixed(2) || 'N/A'}</div>
        <div class="platform-status">${info.title?.substring(0, 20) || ''}...</div>
      </div>
    `;
    container.appendChild(item);
  }
}

document.getElementById('openComparison').addEventListener('click', async () => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const data = result[STORAGE_KEY] || {};

  const prices = {};
  for (const [platform, info] of Object.entries(data)) {
    prices[platform] = info.price;
  }

  localStorage.setItem('618_prices_from_extension', JSON.stringify({
    prices,
    data,
    timestamp: Date.now()
  }));

  chrome.tabs.create({ url: COMPARISON_URL });
  window.close();
});

document.getElementById('clearData').addEventListener('click', async () => {
  await chrome.storage.local.remove(STORAGE_KEY);
  showToast('数据已清除');
  loadData();
});

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

chrome.runtime.sendMessage({ type: 'GET_PRICES' }, (data) => {
  if (data && Object.keys(data).length > 0) {
    document.getElementById('noData').style.display = 'none';
    document.getElementById('platformList').style.display = 'flex';
    document.getElementById('actions').style.display = 'flex';
    renderPlatformList(data);
  }
});