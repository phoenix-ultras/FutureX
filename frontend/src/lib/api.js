const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const ROOT_URL = configuredBaseUrl.replace(/\/api\/?$/, '');
const API_BASE_URL = `${ROOT_URL}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ROOT_URL;

function buildUrl(path) {
  let url = '';
  if (/^https?:\/\//.test(path)) {
    url = path;
  } else if (path.startsWith('/api/')) {
    url = `${ROOT_URL}${path}`;
  } else if (path.startsWith('/')) {
    url = `${ROOT_URL}${path}`;
  } else {
    url = `${API_BASE_URL}/${path}`;
  }
  console.log(`[API Request] -> ${url}`);
  return url;
}

async function request(path, options = {}) {
  const { headers, ...restOptions } = options;
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {})
    }
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function authRequest(path, accessToken, options = {}) {
  return request(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function signup(payload) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function login(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function refreshAccessToken() {
  return request('/api/auth/refresh', {
    method: 'POST'
  });
}

export function logout() {
  return request('/api/auth/logout', {
    method: 'POST'
  });
}

export function getWallet(accessToken) {
  return request('/api/wallet', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function buyCoins(amount, accessToken) {
  return authRequest('/api/wallet/buy-coins', accessToken, {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
}

export function createPaymentIntent(amount, accessToken) {
  return authRequest('/api/wallet/payment-intent', accessToken, {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
}

export function confirmPayment(paymentId, accessToken) {
  return authRequest('/api/wallet/confirm-payment', accessToken, {
    method: 'POST',
    body: JSON.stringify({ paymentId })
  });
}

export function getMarkets(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }

  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  const queryString = searchParams.toString();
  return request(`/market/all${queryString ? `?${queryString}` : ''}`);
}

export function getMarket(id) {
  return request(`/market/${id}`);
}

export function getMarketOdds(id) {
  return request(`/market/${id}/odds`);
}

export function placeTrade(payload) {
  const { accessToken, ...body } = payload;
  return authRequest('/trade/place', accessToken, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function getUserTrades(userId, accessToken) {
  return authRequest(`/user/${userId}/trades`, accessToken);
}

export function getLeaderboard() {
  return request('/leaderboard');
}

export function getUserStats(userId, accessToken) {
  return authRequest(`/user/${userId}/stats`, accessToken);
}

export function getAdminDashboard(accessToken) {
  return authRequest('/api/admin/dashboard', accessToken);
}

export function closeAdminMarket(id, accessToken) {
  return authRequest(`/api/admin/market/close/${id}`, accessToken, {
    method: 'POST'
  });
}

export function settleAdminMarket(id, outcome, accessToken) {
  return authRequest(`/api/admin/market/settle/${id}`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ outcome })
  });
}

export function triggerAdminPayout(id, accessToken) {
  return authRequest(`/api/admin/market/payout/${id}`, accessToken, {
    method: 'POST'
  });
}

export function updateAdminMarketCloseTime(id, closeTime, accessToken) {
  return authRequest(`/api/admin/market/close-time/${id}`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ closeTime })
  });
}

export function getSquads() {
  return request('/api/squads');
}

export function getSquad(id) {
  return request(`/api/squads/${id}`);
}

export function getMySquads(accessToken) {
  return authRequest('/api/squads/my', accessToken);
}

export function createSquad(payload, accessToken) {
  return authRequest('/api/squads', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function joinSquad(id, accessToken) {
  return authRequest(`/api/squads/${id}/join`, accessToken, {
    method: 'POST'
  });
}

export function leaveSquad(id, accessToken) {
  return authRequest(`/api/squads/${id}/leave`, accessToken, {
    method: 'POST'
  });
}
