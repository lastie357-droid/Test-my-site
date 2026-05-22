/**
 * Kenya geo-spoof headers
 * Applied to every outbound request to Shabiki / fapi.shabiki.com
 * Safaricom Kenya IP range: 105.163.x.x
 */

// Pick a realistic Safaricom Kenya IP
const KENYA_IP = '105.163.158.142';

const GEO_HEADERS = {
  'User-Agent':       'Mozilla/5.0 (Linux; Android 11; Tecno Spark 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Accept-Language':  'en-KE,en;q=0.9,sw;q=0.8',
  'Accept':           'application/json, text/plain, */*',
  'Origin':           'https://www.shabiki.com',
  'Referer':          'https://www.shabiki.com/',
  'X-Forwarded-For':  KENYA_IP,
  'X-Real-IP':        KENYA_IP,
  'CF-Connecting-IP': KENYA_IP,
  'CF-IPCountry':     'KE',
  'True-Client-IP':   KENYA_IP,
  'sec-ch-ua':        '"Chromium";v="120", "Not_A Brand";v="8"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-platform': '"Android"',
  'sec-fetch-site':   'same-site',
  'sec-fetch-mode':   'cors',
  'sec-fetch-dest':   'empty',
  'timezone':         'Africa/Nairobi',
  'country':          'KE',
};

/**
 * Returns geo headers merged with any extra headers you pass in.
 * @param {Object} extra - additional headers to merge (override geo if same key)
 */
function kenyaHeaders(extra = {}) {
  return Object.assign({}, GEO_HEADERS, extra);
}

module.exports = { kenyaHeaders, KENYA_IP, GEO_HEADERS };
