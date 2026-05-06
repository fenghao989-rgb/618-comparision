(function() {
  'use strict';

  const platformDetectors = {
    taobao: {
      test: () => location.hostname.includes('taobao.com'),
      getProductInfo: () => {
        const titleEl = document.querySelector('.tb-main-title, #J_Title, h3[itemprop="name"]');
        const priceEl = document.querySelector('.tb-rmb-price, #J_SetPrice, [itemprop="price"]');
        const originalPriceEl = document.querySelector('.tb-origin-price, #J_OriginalPrice');
        const imageEl = document.querySelector('#J_ImgBooth, [itemprop="image"]');
        const productIdEl = document.querySelector('[data-itemid], [data-nid]');

        let productId = location.pathname.match(/item\/(\d+)/)?.[1];
        if (!productId && productIdEl) {
          productId = productIdEl.dataset.itemid || productIdEl.dataset.nid;
        }

        return {
          platform: 'taobao',
          platformName: '淘宝',
          title: titleEl?.textContent?.trim() || document.title,
          price: extractPrice(priceEl?.textContent),
          originalPrice: extractPrice(originalPriceEl?.textContent),
          image: imageEl?.src || imageEl?.getAttribute('data-src'),
          productId: productId,
          url: location.href
        };
      }
    },

    tmall: {
      test: () => location.hostname.includes('tmall.com'),
      getProductInfo: () => {
        const titleEl = document.querySelector('.product-title, #J_DetailTitle, h1[itemprop="name"]');
        const priceEl = document.querySelector('.price, #J_Price, [itemprop="price"]');
        const originalPriceEl = document.querySelector('.original-price, .J_OriginalPrice');
        const imageEl = document.querySelector('#J_ImgBooth, [itemprop="image"]');

        let productId = location.pathname.match(/item\/(\d+)/)?.[1];

        return {
          platform: 'tmall',
          platformName: '天猫',
          title: titleEl?.textContent?.trim() || document.title,
          price: extractPrice(priceEl?.textContent),
          originalPrice: extractPrice(originalPriceEl?.textContent),
          image: imageEl?.src || imageEl?.getAttribute('data-src'),
          productId: productId,
          url: location.href
        };
      }
    },

    jd: {
      test: () => location.hostname.includes('jd.com') && location.pathname.includes('/item/'),
      getProductInfo: () => {
        const titleEl = document.querySelector('.sku-name, #name .p-name', '[itemprop="name"]');
        const priceEl = document.querySelector('.p-price, #jdPricePrice, [itemprop="price"]');
        const imageEl = document.querySelector('#spec-img, .preview-img img', '[itemprop="image"]');

        const productId = location.pathname.match(/(\d+)/)?.[1];

        let price = extractPrice(priceEl?.textContent);
        if (!price) {
          const priceMatch = document.body.innerText.match(/"price":"?([\d.]+)"/);
          if (priceMatch) price = parseFloat(priceMatch[1]);
        }

        return {
          platform: 'jd',
          platformName: '京东',
          title: titleEl?.textContent?.trim() || document.title,
          price: price,
          originalPrice: null,
          image: imageEl?.src || imageEl?.getAttribute('data-src'),
          productId: productId,
          url: location.href
        };
      }
    },

    pinduoduo: {
      test: () => location.hostname.includes('pinduoduo.com'),
      getProductInfo: () => {
        const titleEl = document.querySelector('.goods-title, .product-title, [itemprop="name"]');
        const priceEl = document.querySelector('.price, .discount-price, [itemprop="price"]');
        const imageEl = document.querySelector('.goods-img img, .product-img', '[itemprop="image"]');

        const productId = location.pathname.match(/goods\/(\d+)/)?.[1] || 
                         window.__INITIAL_STATE__?.goods?.goodsId;

        let price = extractPrice(priceEl?.textContent);
        if (!price) {
          const priceMatch = document.body.innerHTML.match(/"groupPrice":"?([\d.]+)"/);
          if (priceMatch) price = parseFloat(priceMatch[1]);
        }

        return {
          platform: 'pinduoduo',
          platformName: '拼多多',
          title: titleEl?.textContent?.trim() || document.title,
          price: price,
          originalPrice: null,
          image: imageEl?.src || imageEl?.getAttribute('data-src'),
          productId: productId,
          url: location.href
        };
      }
    },

    suning: {
      test: () => location.hostname.includes('suning.com'),
      getProductInfo: () => {
        const titleEl = document.querySelector('.p-info .p-name, #productName');
        const priceEl = document.querySelector('.p-price, .price, #priceSpan');
        const imageEl = document.querySelector('.p-img img, #J_Pic_Booth');

        const productId = location.pathname.match(/(\d+)\.html/)?.[1];

        return {
          platform: 'suning',
          platformName: '苏宁',
          title: titleEl?.textContent?.trim() || document.title,
          price: extractPrice(priceEl?.textContent),
          originalPrice: null,
          image: imageEl?.src,
          productId: productId,
          url: location.href
        };
      }
    },

    youzan: {
      test: () => location.hostname.includes('youzan.com'),
      getProductInfo: () => {
        const titleEl = document.querySelector('.product-name, .goods-name, h1');
        const priceEl = document.querySelector('.price, .goods-price, [itemprop="price"]');

        return {
          platform: 'youzan',
          platformName: '有赞',
          title: titleEl?.textContent?.trim() || document.title,
          price: extractPrice(priceEl?.textContent),
          originalPrice: null,
          image: null,
          productId: null,
          url: location.href
        };
      }
    }
  };

  function extractPrice(text) {
    if (!text) return null;
    const match = text.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  function detectPlatform() {
    for (const [name, detector] of Object.entries(platformDetectors)) {
      if (detector.test()) {
        return { name, ...detector };
      }
    }
    return null;
  }

  function getProductInfo() {
    const platform = detectPlatform();
    if (!platform) {
      return { success: false, error: '不在支持的电商平台页面' };
    }

    try {
      const info = platform.getProductInfo();
      if (info.price) {
        return { success: true, ...info };
      } else {
        return { success: false, error: '未能获取到价格信息' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  window.get618ProductInfo = getProductInfo;

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      type: 'PRODUCT_INFO',
      data: getProductInfo()
    });
  }
})();