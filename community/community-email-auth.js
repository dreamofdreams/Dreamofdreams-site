'use strict';

(function initializeEmailAuthModule(root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) root.DreamCommunityEmailAuth = api;

    if (root && root.document) {
        const start = () => api.bootstrap(root.document, {
            fetchImpl: root.fetch.bind(root),
            onAuthenticated: () => root.location.reload()
        });
        if (root.document.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function emailAuthFactory() {
    const DEFAULT_API_ORIGIN = 'https://dod-social-auth-gateway-190c9rby.uc.gateway.dev';
    const REQUEST_TIMEOUT_MS = 10000;

    class EmailAuthError extends Error {
        constructor(code) {
            super(code);
            this.name = 'EmailAuthError';
            this.code = code;
        }
    }

    function normalizeApiOrigin(value) {
        if (typeof value !== 'string') throw new EmailAuthError('INVALID_API_ORIGIN');
        let parsed;
        try {
            parsed = new URL(value);
        } catch (_) {
            throw new EmailAuthError('INVALID_API_ORIGIN');
        }
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
            parsed.pathname !== '/' || parsed.search || parsed.hash) {
            throw new EmailAuthError('INVALID_API_ORIGIN');
        }
        return parsed.origin;
    }

    async function fetchWithTimeout(fetchImpl, url, options) {
        if (typeof fetchImpl !== 'function') throw new EmailAuthError('SERVICE_UNAVAILABLE');
        if (typeof AbortController === 'undefined') return fetchImpl(url, options);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            return await fetchImpl(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }
    }

    async function postCredentials(fetchImpl, origin, path, credentials) {
        let response;
        try {
            response = await fetchWithTimeout(fetchImpl, `${origin}${path}`, {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
        } catch (_) {
            throw new EmailAuthError('SERVICE_UNAVAILABLE');
        }
        return response;
    }

    function createEmailAuthClient({ fetchImpl, apiOrigin = DEFAULT_API_ORIGIN } = {}) {
        const origin = normalizeApiOrigin(apiOrigin);
        return {
            async signup({ displayName, email, password }) {
                const response = await postCredentials(fetchImpl, origin, '/community/email/signup', {
                    displayName,
                    email,
                    password
                });
                if (response.status === 409) throw new EmailAuthError('ACCOUNT_EXISTS');
                if (response.status === 400) throw new EmailAuthError('INVALID_SIGNUP');
                if (response.status === 429) throw new EmailAuthError('RATE_LIMITED');
                if (response.status !== 201) throw new EmailAuthError('SERVICE_UNAVAILABLE');
                return { authenticated: true };
            },

            async login({ email, password }) {
                const response = await postCredentials(fetchImpl, origin, '/community/email/login', {
                    email,
                    password
                });
                if (response.status === 400) throw new EmailAuthError('INVALID_LOGIN');
                if (response.status === 401) throw new EmailAuthError('INVALID_CREDENTIALS');
                if (response.status === 429) throw new EmailAuthError('RATE_LIMITED');
                if (response.status !== 200) throw new EmailAuthError('SERVICE_UNAVAILABLE');
                return { authenticated: true };
            }
        };
    }

    function requireElement(documentRef, id) {
        const element = documentRef.getElementById(id);
        if (!element) throw new EmailAuthError(`MISSING_ELEMENT_${id}`);
        return element;
    }

    function messageFor(code, mode) {
        if (code === 'ACCOUNT_EXISTS') return 'An account with that email already exists. Log in instead.';
        if (code === 'INVALID_CREDENTIALS') return 'The email or password was not recognized.';
        if (code === 'RATE_LIMITED') return 'Too many attempts. Please wait before trying again.';
        if (code === 'INVALID_SIGNUP') return 'Check your name, email, and password, then try again.';
        if (code === 'INVALID_LOGIN') return 'Check your email and password, then try again.';
        return `Email ${mode} is temporarily unavailable. Please try again.`;
    }

    function createEmailAuthController({ documentRef, client, onAuthenticated }) {
        if (!documentRef || !client || typeof onAuthenticated !== 'function') {
            throw new EmailAuthError('INVALID_CONTROLLER_OPTIONS');
        }

        const signupForm = requireElement(documentRef, 'email-signup-form');
        const signupButton = requireElement(documentRef, 'email-signup-button');
        const signupMessage = requireElement(documentRef, 'email-signup-message');
        const signupName = requireElement(documentRef, 'signup-display-name');
        const signupEmail = requireElement(documentRef, 'signup-email');
        const signupPassword = requireElement(documentRef, 'signup-password');
        const signupPasswordConfirm = requireElement(documentRef, 'signup-password-confirm');
        const loginForm = requireElement(documentRef, 'email-login-form');
        const loginButton = requireElement(documentRef, 'email-login-button');
        const loginMessage = requireElement(documentRef, 'email-login-message');
        const loginEmail = requireElement(documentRef, 'login-email');
        const loginPassword = requireElement(documentRef, 'login-password');
        let submitting = false;

        async function submit(mode) {
            if (submitting) return;
            const isSignup = mode === 'signup';
            const form = isSignup ? signupForm : loginForm;
            if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

            const button = isSignup ? signupButton : loginButton;
            const message = isSignup ? signupMessage : loginMessage;
            const passwordInput = isSignup ? signupPassword : loginPassword;
            if (isSignup && signupPassword.value !== signupPasswordConfirm.value) {
                signupMessage.textContent = 'The passwords do not match.';
                return;
            }
            submitting = true;
            signupButton.disabled = true;
            loginButton.disabled = true;
            message.textContent = isSignup ? 'Creating your account…' : 'Logging you in…';

            try {
                if (isSignup) {
                    await client.signup({
                        displayName: signupName.value,
                        email: signupEmail.value,
                        password: signupPassword.value
                    });
                } else {
                    await client.login({
                        email: loginEmail.value,
                        password: loginPassword.value
                    });
                }
                passwordInput.value = '';
                if (isSignup) signupPasswordConfirm.value = '';
                message.textContent = 'Success. Opening the community…';
                onAuthenticated();
            } catch (error) {
                passwordInput.value = '';
                if (isSignup) signupPasswordConfirm.value = '';
                message.textContent = messageFor(error && error.code, mode);
                submitting = false;
                signupButton.disabled = false;
                loginButton.disabled = false;
            }
        }

        signupForm.addEventListener('submit', event => {
            event.preventDefault();
            submit('signup');
        });
        loginForm.addEventListener('submit', event => {
            event.preventDefault();
            submit('login');
        });

        return { submit };
    }

    function bootstrap(documentRef, options = {}) {
        try {
            const client = createEmailAuthClient({
                fetchImpl: options.fetchImpl,
                apiOrigin: options.apiOrigin || DEFAULT_API_ORIGIN
            });
            return createEmailAuthController({
                documentRef,
                client,
                onAuthenticated: options.onAuthenticated
            });
        } catch (_) {
            const signupButton = documentRef && documentRef.getElementById('email-signup-button');
            const loginButton = documentRef && documentRef.getElementById('email-login-button');
            const signupMessage = documentRef && documentRef.getElementById('email-signup-message');
            if (signupButton) signupButton.disabled = true;
            if (loginButton) loginButton.disabled = true;
            if (signupMessage) signupMessage.textContent = 'Email authentication could not be initialized.';
            return null;
        }
    }

    return {
        DEFAULT_API_ORIGIN,
        EmailAuthError,
        normalizeApiOrigin,
        createEmailAuthClient,
        createEmailAuthController,
        messageFor,
        bootstrap
    };
}));
