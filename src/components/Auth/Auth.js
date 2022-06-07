/* eslint-disable no-unused-vars */
import React, {
  useState,
  useEffect,
} from 'react';

import {
  PD_OAUTH_CLIENT_ID,
  PD_OAUTH_CLIENT_SECRET,
} from 'config/constants';

const gen64x8bitNonce = () => {
  const array = new Uint8Array(64);
  window.crypto.getRandomValues(array);
  return array;
};

const digestVerifier = async (vString) => {
  const encoder = new TextEncoder();
  const verifier = encoder.encode(vString);
  const hash = await crypto.subtle.digest('SHA-256', verifier);
  return hash;
};

const base64Unicode = (buffer) => {
  // |*|  Base64 / binary data / UTF-8 strings utilities (#1)
  // |*|  https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
  // |*|  Author: madmurphy
  /* eslint-disable no-nested-ternary */
  /* eslint-disable arrow-body-style */
  const uint6ToB64 = (nUint6) => {
    return nUint6 < 26
      ? nUint6 + 65
      : nUint6 < 52
        ? nUint6 + 71
        : nUint6 < 62
          ? nUint6 - 4
          : nUint6 === 62
            ? 43
            : nUint6 === 63
              ? 47
              : 65;
  };

  const base64EncArr = (aBytes) => {
    const eqLen = (3 - (aBytes.length % 3)) % 3;
    let sB64Enc = '';

    for (let nMod3, nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
      nMod3 = nIdx % 3;
      /* Uncomment the following line in order to split the output in lines 76-character long: */
      /*
      if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
      */
      /* eslint-disable no-bitwise */
      nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24);
      if (nMod3 === 2 || aBytes.length - nIdx === 1) {
        sB64Enc += String.fromCharCode(
          uint6ToB64((nUint24 >>> 18) & 63),
          uint6ToB64((nUint24 >>> 12) & 63),
          uint6ToB64((nUint24 >>> 6) & 63),
          uint6ToB64(nUint24 & 63),
        );
        nUint24 = 0;
      }
    }
    return eqLen === 0
      ? sB64Enc
      : sB64Enc.substring(0, sB64Enc.length - eqLen) + (eqLen === 1 ? '=' : '==');
  };
  let encodedArr = base64EncArr(new Uint8Array(buffer));
  // manually finishing up the url encoding fo the encodedArr
  encodedArr = encodedArr.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return encodedArr;
};

const createCodeVerifier = () => {
  // generate code verifier
  const generatedCode = gen64x8bitNonce();
  // base64 encode code_verifier
  return base64Unicode(generatedCode.buffer);
};

const getAuthURL = async (clientID, clientSecret, redirectURL, codeVerifier) => {
  const challengeBuffer = await digestVerifier(codeVerifier);
  // base64 encode the challenge
  const challenge = base64Unicode(challengeBuffer);
  // build authUrl
  const authUrl = 'https://app.pagerduty.com/oauth/authorize?'
    + `client_id=${clientID}&`
    // + `client_secret=${clientSecret}&`
    + `redirect_uri=${redirectURL}&`
    + 'response_type=code&'
    + `code_challenge=${encodeURI(challenge)}&`
    + 'code_challenge_method=S256';

  return authUrl;
};

const exchangeCodeForToken = async (clientID, clientSecret, redirectURL, codeVerifier, code) => {
  // eslint-disable-next-line no-unused-vars
  const postData = async (url, _data) => {
    const response = await fetch(url, {
      method: 'POST',
    });
    const json = response.json();
    return json;
  };

  const requestTokenUrl = 'https://app.pagerduty.com/oauth/token?'
    + 'grant_type=authorization_code&'
    + `code=${code}&`
    + `redirect_uri=${redirectURL}&`
    + `client_id=${clientID}&`
    // + `client_secret=${clientSecret}&`
    + `code_verifier=${codeVerifier}`;
  const data = await postData(requestTokenUrl, {});
  if (data.access_token) {
    return data.access_token;
  }
  return null;
};

const Auth = (props) => {
  const [authURL, setAuthURL] = useState();

  const id = PD_OAUTH_CLIENT_ID;
  const secret = PD_OAUTH_CLIENT_SECRET;
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = sessionStorage.getItem('pd_access_token');
  const code = urlParams.get('code');
  let codeVerifier = sessionStorage.getItem('code_verifier');

  let {
    redirectURL,
  } = props;
  if (!redirectURL) {
    // assume that the redirect URL is the current page
    redirectURL = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  }

  useEffect(() => {
    if (code && codeVerifier && !accessToken) {
      exchangeCodeForToken(id, secret, redirectURL, codeVerifier, code).then((token) => {
        sessionStorage.removeItem('code_verifier');
        sessionStorage.setItem('pd_access_token', token);
        window.location.assign(redirectURL);
      });
    } else if (!accessToken) {
      codeVerifier = createCodeVerifier();
      sessionStorage.setItem('code_verifier', codeVerifier);
      getAuthURL(id, secret, redirectURL, codeVerifier).then((url) => {
        setAuthURL(url);
      });
    }
  }, []);

  /* eslint-disable react/jsx-one-expression-per-line */
  if (code && codeVerifier) {
    return (
      <div align="center">
        <p>&nbsp;</p>
        Logging in to PagerDuty...
      </div>
    );
  }
  return (
    <div align="center">
      <p>&nbsp;</p>
      <h2>PagerDuty Login</h2>
      Connect to PagerDuty to use this app.
      <p>&nbsp;</p>
      <a id="pd-login-button" className="btn btn-lg btn-primary auth-button" href={authURL}>
        Authorize PagerDuty
      </a>
    </div>
  );
};

export default Auth;
