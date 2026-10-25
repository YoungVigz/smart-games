const API_URL = process.env.NEXT_PUBLIC_API_URL;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

const forceLogout = (setToken: (t: string | null) => void) => {
    isRefreshing = false;
    setToken(null);
    window.dispatchEvent(new Event('force-logout'));
};

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const getStoredToken = () => (window as any).__ACCESS_TOKEN__ as string | null;
    const setStoredToken = (t: string | null) => ((window as any).__ACCESS_TOKEN__ = t);

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (getStoredToken()) {
        headers.set('Authorization', `Bearer ${getStoredToken()}`);
    }

    const makeRequest = () =>
        fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
        });

    let response = await makeRequest();

    const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');

    if (response.status === 401 && !isAuthEndpoint) {
        if (isRefreshing) {
            return new Promise((resolve) => {
                subscribeTokenRefresh((token) => {
                    headers.set('Authorization', `Bearer ${token}`);
                    resolve(makeRequest());
                });
            });
        }

        isRefreshing = true;

        try {
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (refreshRes.ok) {
                const refreshJson = await refreshRes.json();
                const newToken = refreshJson.data.accessToken;
                setStoredToken(newToken);
                isRefreshing = false;
                onRefreshed(newToken);

                headers.set('Authorization', `Bearer ${newToken}`);
                return makeRequest();
            } else {
                // REFRESH PADŁ - CZYŚCIMY WSZYSTKO
                setStoredToken(null);
                isRefreshing = false;
                
                // Krytyczne: strzał do logoutu, żeby backend usunął ciastko HTTP-Only!
                await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
                
                window.dispatchEvent(new Event('force-logout'));
                return response;
            }
        } catch (err) {
            isRefreshing = false;
            window.dispatchEvent(new Event('force-logout'));
            throw err;
        }
    }

    return response;
}