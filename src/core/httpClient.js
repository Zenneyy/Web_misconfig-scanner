// core/httpClient.js
import axios from 'axios';
import https from 'https';
import { URL } from 'url';
import { isPrivateNetwork } from './utils.js';

export const createHttpClient = (timeout = 10000) => {
  return axios.create({
    timeout,
    maxRedirects: 0, // Manual redirect handling for better security control
    maxContentLength: 1024 * 1024 * 2, // 2MB limit
    maxBodyLength: 1024 * 1024 * 2,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Scanner needs to see self-signed certs too
    headers: {
      'User-Agent': 'WebMisconfigScanner/1.0 (Security Audit)',
      'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    },
    validateStatus: () => true, // Don't throw on 404/500
  });
};

export const fetchUrl = async (url, options = {}) => {
  // 🛡️ SSRF Guard: Check URL before request
  try {
    const parsed = new URL(url);
    if (isPrivateNetwork(parsed.hostname)) {
      return { url, status: 0, error: 'Blocked: Private Network Access', headers: {}, data: '' };
    }
  } catch (e) {
    return { url, status: 0, error: 'Invalid URL', headers: {}, data: '' };
  }

  const client = createHttpClient(options.timeout);

  try {
    const response = await client.get(url, { responseType: 'text', ...options });
    const finalUrl = response.request?.res?.responseUrl || url;

    return {
      url: response.config.url,
      status: response.status,
      headers: response.headers || {},
      data: response.data ? String(response.data).substring(0, 50000) : '',
      finalUrl,
      redirectLocation: response.headers?.location || null,
    };
  } catch (error) {
    return {
      url,
      status: 0,
      error: error.message,
      headers: {},
      data: '',
      finalUrl: url,
      redirectLocation: null,
    };
  }
};