import { jwtDecode } from 'jwt-decode';
import camelcaseKeys from 'camelcase-keys';
import conf from '../env.json';

import $ from 'jquery';
import 'notifyjs-browser';

export function getUrl(url) {
  $.notify('Go link created successfully', 'success');
  return `${conf.server_endpoint}${url}`;
}

function get(url, headers = {}) {
  return fetch(getUrl(url), {
    headers: headers,
  });
}

function post(url, data, headers = {}) {
  return fetch(getUrl(url), {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

const isTokenExpired = token => {
  if (!token) return false;
  const decoded = jwtDecode(token);
  return Date.now() >= decoded.exp * 1000;
};

const checkUserAuthInfo = () => {
  return new Promise(function(resolve, reject) {
    chrome.storage.local.get(['token'], result => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError.message);
      } else {
        if (!result.token) {
          reject(new Error('No token found!'));
          return;
        }
        if (isTokenExpired(result.token.access_token)) {
          if (isTokenExpired(result.token.refresh_token)) {
            reject(new Error('Access token is expired, and no refresh token found.'));
            return;
          }
          // Use refresh token to renew access token.
          refreshToken(result.token.refresh_token)
            .then(r => resolve(r))
            .catch(e => reject(e));
        } else {
          resolve(result.token);
        }
      }
    });
  });
};

export const isLoggedIn = () => {
  return new Promise((resolve, reject) => {
    checkUserAuthInfo()
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
};
export const requestEmailCode = (email) => {
  return new Promise((resolve, reject) => {
    post('/email_code', { email: email }).then(response => {
      $.notify('Verification Code has been sent to your email', 'success');
    }).catch(error => {
      console.error(error);
      reject(error);
    });
  });
};

export const login = (email, code) => {
  return new Promise((resolve, reject) => {
    post('/login', { email: email, code: code })
      .then(response => response.json())
      .then(token => {
        // Token should be returned here.
        chrome.storage.local.set({ token: token }, function() {
          resolve(token.access_token);
        });
      })
      .catch(error => {
        console.error(error);
        reject(error);
      });
  });
};

export const refreshToken = refreshToken => {
  return new Promise((resolve, reject) => {
    post('/refresh_token', {
      refresh_token: refreshToken,
    })
      .then(response => response.json())
      .then(token => {
        // Token should be returned here.
        token.refresh_token = refreshToken;
        chrome.storage.local.set({ token: token }, function() {
          resolve(token.access_token);
        });
      })
      .catch(error => {
        console.error(error);
        reject(error);
      });
  });
};

export const fetchAllMyNotes = keyword => {
  return new Promise((resolve, reject) => {
    checkUserAuthInfo()
      .then(res => {

        get('/notes' + (keyword ? '?keyword=' + keyword : ''), { Authorization: res.access_token })
          .then(response => response.json())
          .then(data => {
            resolve(camelcaseKeys(data));
          })
          .catch(error => {
            console.log(error);
            reject(error);
          });
      })
      .catch(err => {
        reject(err);
      });
  });
};

export const fetchGoLinks = url => {
  return new Promise((resolve, reject) => {
    checkUserAuthInfo()
      .then(res => {
        post('/go_links', { link: url }, { Authorization: res.access_token })
          .then(response => response.json())
          .then(data => {
            resolve(camelcaseKeys(data));
          })
          .catch(error => {
            console.error(error);
            reject(error);
          });
      })
      .catch(err => {
        reject(err);
      });
  });
};

export const saveGoLink = (url, urlKey) => {
  return new Promise((resolve, reject) => {
    checkUserAuthInfo()
      .then(res => {
        post('/go_link', {
          link: url,
          key: urlKey,
        }, { Authorization: res.access_token })
          .then(response => {
            return response.json();
          }).then(data => {
          $.notify('Go link created successfully', 'success');
          resolve(camelcaseKeys(data));

        }).catch(e => {
          // it can be error, but no block for server side processing, not sure why
          console.error('Error:' + e.message);
          reject(e);
        });
      })
      .catch(err => {
        reject(err);
      });
  });
};
