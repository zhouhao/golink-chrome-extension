import { getRealUrl } from './http-client';

const RESET_LOCAL_CACHE = 'RESET_LOCAL_CACHE';
const isGoLink = (tab) => {
  if (!tab || !tab.url) return false;

  const url = tab.url.toLowerCase();
  return url.startsWith('http://go/') || url.startsWith('https://go/');
};

const parseKey = (url) => {
  const pathname = new URL(url).pathname;
  return pathname.split('/').pop();
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: 'Logout Go Link Account',
    id: RESET_LOCAL_CACHE,
    contexts: ['all'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === RESET_LOCAL_CACHE) {
    chrome.storage.local.clear(() => {
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // console.log('tab updated', tab.url)
  if (isGoLink(tab)) {
    getRealUrl(tab.url).then(data => {
      if (data.link) {
        chrome.tabs.update({ url: data.link });
      } else {
        chrome.tabs.update({ url: 'https://go.saltyee.com/' });
      }
    }).catch(e => {
      console.error('Error:' + e.message);
      chrome.tabs.update({ url: 'https://go.saltyee.com/' });
    });
  }
});




