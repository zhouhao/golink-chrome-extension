import $ from 'jquery';
import 'notifyjs-browser';
import {
  checkUserAuthInfo,
  fetchGoLinksByUrl,
  getCurrentUrl,
  login,
  requestEmailCode,
  saveGoLink,
} from './http-client';

const isValidEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
};

const showAfterLogin = () => {
  $('#spinner').hide();
  $('.no-login').hide();
  $('.need-login').show();
};

const showBeforeLogin = () => {
  $('#spinner').hide();
  $('.no-login').show();
  $('.need-login').hide();
};

const renderGoLinks = (goLinks) => {
  const list = $('#go-links');
  list.empty();
  if (goLinks.length === 0) {
    list.append('<li>No go links found</li>');
    return;
  }
  for (let i = 0; i < goLinks.length; i++) {
    let link = goLinks[i];
    list.append('<li><a href=\'' + link.link + '\' target=\'_blank\'> https://go/' + link.key + '</a></li>');
  }
};
//---------------------------------
$('#send-email-code').on('click', function() {
  let email = $('input#user-email').val().trim();
  if (!isValidEmail(email)) {
    alert(email + ' is not a valid email address');
    return;
  }

  requestEmailCode(email).then(response => {
    $.notify('Email code sent successfully', 'success');
  });
});

$('#login').on('click', function() {
  let email = $('input#user-email').val().trim();
  let emailCode = $('input#email-code').val().trim();
  if (!isValidEmail(email) || emailCode.length === 0) {
    alert('Please make sure email and code are valid');
    return;
  }

  login(email, emailCode).then(() => {
    showAfterLogin();
  });
});

$('#create-new-link').on('click', function() {
  let urlKey = $('input#url-key').val().trim();
  if (urlKey.length === 0) {
    alert('Please enter a valid go link key');
    return;
  }

  getCurrentUrl().then(url => {
    saveGoLink(url, urlKey).then(data => {
      alert('data = ' + JSON.stringify(data));
      $.notify('Go link created successfully', 'success');
    }).catch(e => {
      // it can be error, but no block for server side processing, not sure why
      console.error('Error:' + e.message);
    }).finally(() => {
      fetchGoLinksByUrl(url).then(goLinks => {
        renderGoLinks(goLinks);
      });
    });
  });
});

checkUserAuthInfo()
  .then(res => {
    showAfterLogin();
  }).catch(err => {
  showBeforeLogin();
});

getCurrentUrl().then(url => {
  fetchGoLinksByUrl(url).then(goLinks => {
    renderGoLinks(goLinks);
  });
});
