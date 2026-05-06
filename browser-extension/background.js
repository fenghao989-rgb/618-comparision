const STORAGE_KEY = '618_price_data';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PRODUCT_INFO') {
    handleProductInfo(message.data, sender.tab);
  } else if (message.type === 'GET_PRICES') {
    getStoredPrices().then(sendResponse);
    return true;
  } else if (message.type === 'CLEAR_PRICES') {
    clearStoredPrices().then(sendResponse);
    return true;
  } else if (message.type === 'OPEN_COMPARISON') {
    openComparisonPage(message.data);
  }
});

async function handleProductInfo(info, tab) {
  if (!info.success) return;

  const stored = await getStoredPrices();
  
  const platformKey = info.platform;
  stored[platformKey] = {
    ...info,
    tabId: tab.id,
    tabTitle: tab.title,
    timestamp: Date.now()
  };

  await chrome.storage.local.set({ [STORAGE_KEY]: stored });
}

async function getStoredPrices() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || {};
}

async function clearStoredPrices() {
  await chrome.storage.local.remove(STORAGE_KEY);
  return { success: true };
}

function openComparisonPage(productData) {
  const url = new URL('https://fenghao989-rgb.github.io/618-comparision');
  if (productData) {
    url.hash = `import?platform=${productData.platform}&id=${productData.productId}&price=${productData.price}`;
  }
  chrome.tabs.create({ url: url.href });
}

chrome.action.onClicked.addListener(async (tab) => {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.get618ProductInfo ? window.get618ProductInfo() : null
    });

    if (results && results[0] && results[0].result) {
      const info = results[0].result;
      if (info.success) {
        await handleProductInfo(info, tab);
        chrome.action.openPopup();
      } else {
        console.log('未能获取商品信息:', info.error);
      }
    }
  } catch (error) {
    console.error('执行脚本失败:', error);
  }
});