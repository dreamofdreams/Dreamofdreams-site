'use strict';

(function initializeCommunityModule(root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.DreamCommunity = api;
    }

    if (root && root.document) {
        const start = () => {
            api.bootstrap(root.document, {
                fetchImpl: root.fetch.bind(root),
                apiOrigin: api.DEFAULT_API_ORIGIN
            });
        };

        if (root.document.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function communityFactory() {
    const DEFAULT_API_ORIGIN = 'https://dod-social-auth-gateway-190c9rby.uc.gateway.dev';
    const FALLBACK_AVATAR_PATH = '../dream_of_dreams_logo.png';
    const REQUEST_TIMEOUT_MS = 10000;
    const MEMBER_PROVIDERS = new Set(['tiktok', 'google', 'facebook', 'email']);

    class CommunityServiceError extends Error {
        constructor(code) {
            super(code);
            this.name = 'CommunityServiceError';
            this.code = code;
        }
    }

    function normalizeApiOrigin(value) {
        if (typeof value !== 'string') throw new CommunityServiceError('INVALID_API_ORIGIN');

        let parsed;
        try {
            parsed = new URL(value);
        } catch (_) {
            throw new CommunityServiceError('INVALID_API_ORIGIN');
        }

        if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
            parsed.pathname !== '/' || parsed.search || parsed.hash) {
            throw new CommunityServiceError('INVALID_API_ORIGIN');
        }

        return parsed.origin;
    }

    function normalizeAvatarUrl(value) {
        if (typeof value !== 'string' || value.length > 2048) return null;

        try {
            const parsed = new URL(value);
            if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
            parsed.hash = '';
            return parsed.toString();
        } catch (_) {
            return null;
        }
    }

    function normalizeMemberPayload(payload) {
        if (!payload || payload.authenticated !== true || !payload.user ||
            !MEMBER_PROVIDERS.has(payload.user.provider)) {
            throw new CommunityServiceError('INVALID_PROFILE');
        }

        if (typeof payload.user.displayName !== 'string') {
            throw new CommunityServiceError('INVALID_PROFILE');
        }

        const displayName = payload.user.displayName.trim();
        if (!displayName || displayName.length > 100) {
            throw new CommunityServiceError('INVALID_PROFILE');
        }

        return {
            provider: payload.user.provider,
            displayName,
            avatarUrl: normalizeAvatarUrl(payload.user.avatarUrl)
        };
    }

    async function fetchWithTimeout(fetchImpl, url, options) {
        if (typeof fetchImpl !== 'function') {
            throw new CommunityServiceError('FETCH_UNAVAILABLE');
        }

        if (typeof AbortController === 'undefined') {
            return fetchImpl(url, options);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            return await fetchImpl(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }
    }

    function createCommunityClient({ fetchImpl, apiOrigin = DEFAULT_API_ORIGIN }) {
        const origin = normalizeApiOrigin(apiOrigin);

        return {
            async getCurrentUser() {
                let response;
                try {
                    response = await fetchWithTimeout(fetchImpl, `${origin}/community/auth/me`, {
                        method: 'GET',
                        credentials: 'include',
                        cache: 'no-store',
                        headers: { Accept: 'application/json' }
                    });
                } catch (_) {
                    throw new CommunityServiceError('SERVICE_UNAVAILABLE');
                }

                if (response.status === 401) return { authenticated: false };
                if (!response.ok) throw new CommunityServiceError('SERVICE_UNAVAILABLE');

                let payload;
                try {
                    payload = await response.json();
                } catch (_) {
                    throw new CommunityServiceError('INVALID_RESPONSE');
                }

                return {
                    authenticated: true,
                    user: normalizeMemberPayload(payload)
                };
            },

            async logout() {
                let response;
                try {
                    response = await fetchWithTimeout(fetchImpl, `${origin}/community/auth/logout`, {
                        method: 'POST',
                        credentials: 'include',
                        cache: 'no-store',
                        headers: { Accept: 'application/json' }
                    });
                } catch (_) {
                    throw new CommunityServiceError('SERVICE_UNAVAILABLE');
                }

                if (!response.ok) throw new CommunityServiceError('LOGOUT_FAILED');
            }
        };
    }

    function requireElement(documentRef, id) {
        const element = documentRef.getElementById(id);
        if (!element) throw new CommunityServiceError(`MISSING_ELEMENT_${id}`);
        return element;
    }

    function collectView(documentRef) {
        return {
            loading: requireElement(documentRef, 'loading-view'),
            signedOut: requireElement(documentRef, 'signed-out-view'),
            error: requireElement(documentRef, 'error-view'),
            member: requireElement(documentRef, 'member-view'),
            status: requireElement(documentRef, 'auth-status'),
            errorMessage: requireElement(documentRef, 'error-message'),
            retryButton: requireElement(documentRef, 'retry-button'),
            logoutButton: requireElement(documentRef, 'logout-button'),
            memberName: requireElement(documentRef, 'member-name'),
            memberAvatar: requireElement(documentRef, 'member-avatar'),
            copyrightYear: requireElement(documentRef, 'copyright-year')
        };
    }

    function createCommunityController({ documentRef, client }) {
        if (!documentRef || !client) throw new CommunityServiceError('INVALID_CONTROLLER_OPTIONS');
        const view = collectView(documentRef);
        let requestSequence = 0;

        function showOnly(name) {
            view.loading.hidden = name !== 'loading';
            view.signedOut.hidden = name !== 'signedOut';
            view.error.hidden = name !== 'error';
            view.member.hidden = name !== 'member';
        }

        function showLoading() {
            showOnly('loading');
            view.status.textContent = 'Checking your community session.';
        }

        function showSignedOut(message = 'You are signed out.') {
            showOnly('signedOut');
            view.status.textContent = message;
            view.memberName.textContent = 'Dreamer';
            view.memberAvatar.src = FALLBACK_AVATAR_PATH;
            view.memberAvatar.alt = '';
        }

        function showError(message) {
            showOnly('error');
            view.errorMessage.textContent = message;
            view.status.textContent = message;
        }

        function showMember(user) {
            showOnly('member');
            view.memberName.textContent = user.displayName;
            view.memberAvatar.src = user.avatarUrl || FALLBACK_AVATAR_PATH;
            view.memberAvatar.alt = user.avatarUrl ? `${user.displayName}'s community avatar` : '';
            view.memberAvatar.referrerPolicy = 'no-referrer';
            view.status.textContent = `Signed in as ${user.displayName}.`;
        }

        async function refresh() {
            const sequence = ++requestSequence;
            showLoading();

            try {
                const result = await client.getCurrentUser();
                if (sequence !== requestSequence) return;
                if (!result.authenticated) {
                    showSignedOut();
                    return;
                }
                showMember(result.user);
            } catch (_) {
                if (sequence !== requestSequence) return;
                showError('The community service is temporarily unavailable. Please try again.');
            }
        }

        async function logout() {
            const sequence = ++requestSequence;
            view.logoutButton.disabled = true;
            view.status.textContent = 'Signing you out.';

            try {
                await client.logout();
                if (sequence !== requestSequence) return;
                showSignedOut('You have been signed out.');
            } catch (_) {
                if (sequence !== requestSequence) return;
                showError('We could not complete logout. Please try again.');
            } finally {
                if (sequence === requestSequence) view.logoutButton.disabled = false;
            }
        }

        view.retryButton.addEventListener('click', refresh);
        view.logoutButton.addEventListener('click', logout);
        view.memberAvatar.addEventListener('error', () => {
            if (!view.memberAvatar.src.endsWith(FALLBACK_AVATAR_PATH.replace('../', '/'))) {
                view.memberAvatar.src = FALLBACK_AVATAR_PATH;
                view.memberAvatar.alt = '';
            }
        });
        view.copyrightYear.textContent = String(new Date().getFullYear());

        return { refresh, logout };
    }

    function bootstrap(documentRef, options = {}) {
        try {
            const client = createCommunityClient({
                fetchImpl: options.fetchImpl,
                apiOrigin: options.apiOrigin || DEFAULT_API_ORIGIN
            });
            const controller = createCommunityController({ documentRef, client });
            controller.refresh();
            return controller;
        } catch (_) {
            const status = documentRef && documentRef.getElementById('auth-status');
            const loading = documentRef && documentRef.getElementById('loading-view');
            const error = documentRef && documentRef.getElementById('error-view');
            const message = documentRef && documentRef.getElementById('error-message');
            if (loading) loading.hidden = true;
            if (error) error.hidden = false;
            if (message) message.textContent = 'The community page could not be initialized.';
            if (status) status.textContent = 'The community page could not be initialized.';
            return null;
        }
    }

    return {
        DEFAULT_API_ORIGIN,
        CommunityServiceError,
        normalizeApiOrigin,
        normalizeAvatarUrl,
        normalizeMemberPayload,
        createCommunityClient,
        createCommunityController,
        bootstrap
    };
}));
