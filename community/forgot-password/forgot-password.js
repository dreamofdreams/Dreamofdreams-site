'use strict';

(function initializeForgotPassword(root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (!root || !root.document) return;
    const start = () => api.bootstrap(root.document, root.fetch.bind(root));
    if (root.document.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', start, { once: true });
    } else start();
}(typeof globalThis !== 'undefined' ? globalThis : this, function forgotPasswordFactory() {
    const API_ORIGIN = 'https://dod-social-auth-gateway-190c9rby.uc.gateway.dev';
    const REQUEST_PATH = '/community/email/password-reset/request';
    const TIMEOUT_MS = 10000;

    function bootstrap(documentRef, fetchImpl) {
        const form = documentRef.getElementById('forgot-password-form');
        const email = documentRef.getElementById('account-email');
        const button = documentRef.getElementById('request-button');
        const message = documentRef.getElementById('request-message');
        if (!form || !email || !button || !message || typeof fetchImpl !== 'function') return null;
        let submitting = false;
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (submitting || (typeof form.reportValidity === 'function' && !form.reportValidity())) return;
            submitting = true;
            button.disabled = true;
            message.textContent = 'Sending your request…';
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
            try {
                const response = await fetchImpl(`${API_ORIGIN}${REQUEST_PATH}`, {
                    method: 'POST',
                    credentials: 'include',
                    cache: 'no-store',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.value.trim() }),
                    signal: controller.signal
                });
                if (response.status === 429) {
                    message.textContent = 'Too many requests. Please wait before trying again.';
                    return;
                }
                if (response.status !== 202) throw new Error('REQUEST_FAILED');
                message.textContent = 'If an account exists for this address, you will receive a reset link. Check your inbox.';
                email.value = '';
            } catch (_) {
                message.textContent = 'We could not send your request. Please try again shortly.';
            } finally {
                clearTimeout(timeout);
                submitting = false;
                button.disabled = false;
            }
        });
        return { form, email, button, message };
    }

    return { bootstrap };
}));
