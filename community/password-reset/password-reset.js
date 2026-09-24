'use strict';

(function initializePasswordResetModule(root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.DreamPasswordReset = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function passwordResetFactory() {
    const DEFAULT_API_ORIGIN = 'https://dod-social-auth-gateway-190c9rby.uc.gateway.dev';
    const CONFIRM_PATH = '/community/email/password-reset/confirm';
    const RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
    const MIN_PASSWORD_LENGTH = 8;
    const MAX_PASSWORD_LENGTH = 128;
    const MAX_PASSWORD_BYTES = 1024;
    const REQUEST_TIMEOUT_MS = 10000;

    class PasswordResetPageError extends Error {
        constructor(code) {
            super(code);
            this.name = 'PasswordResetPageError';
            this.code = code;
        }
    }

    function normalizeResetToken(value) {
        if (typeof value !== 'string' || !RESET_TOKEN_PATTERN.test(value)) {
            throw new PasswordResetPageError('INVALID_RESET_TOKEN');
        }
        return value;
    }

    function consumeResetToken({ locationRef, historyRef } = {}) {
        if (!locationRef || typeof locationRef.pathname !== 'string' ||
            typeof locationRef.search !== 'string' || typeof locationRef.hash !== 'string' ||
            !historyRef || typeof historyRef.replaceState !== 'function') {
            throw new PasswordResetPageError('INVALID_BROWSER_STATE');
        }

        const fragment = locationRef.hash;
        historyRef.replaceState(
            null,
            '',
            `${locationRef.pathname}${locationRef.search}`
        );

        const match = /^#token=([A-Za-z0-9_-]{43})$/.exec(fragment);
        if (!match) throw new PasswordResetPageError('INVALID_RESET_TOKEN');
        return normalizeResetToken(match[1]);
    }

    function utf8ByteLength(value) {
        if (typeof TextEncoder !== 'function') {
            throw new PasswordResetPageError('INVALID_PASSWORD');
        }
        return new TextEncoder().encode(value).length;
    }

    function validateNewPassword(value) {
        if (typeof value !== 'string') {
            throw new PasswordResetPageError('INVALID_PASSWORD');
        }

        const length = Array.from(value).length;
        if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH ||
            utf8ByteLength(value) > MAX_PASSWORD_BYTES) {
            throw new PasswordResetPageError('INVALID_PASSWORD');
        }
        return value;
    }

    function normalizeApiOrigin(value) {
        if (typeof value !== 'string') {
            throw new PasswordResetPageError('INVALID_API_ORIGIN');
        }

        let parsed;
        try {
            parsed = new URL(value);
        } catch (_) {
            throw new PasswordResetPageError('INVALID_API_ORIGIN');
        }

        if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
            parsed.pathname !== '/' || parsed.search || parsed.hash) {
            throw new PasswordResetPageError('INVALID_API_ORIGIN');
        }
        return parsed.origin;
    }

    async function fetchWithTimeout(fetchImpl, url, options) {
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

    function createPasswordResetClient({
        fetchImpl,
        apiOrigin = DEFAULT_API_ORIGIN
    } = {}) {
        if (typeof fetchImpl !== 'function') {
            throw new PasswordResetPageError('INVALID_CLIENT_CONFIG');
        }
        const origin = normalizeApiOrigin(apiOrigin);

        return {
            async confirmPassword({ token, newPassword } = {}) {
                const normalizedToken = normalizeResetToken(token);
                const normalizedPassword = validateNewPassword(newPassword);

                let result;
                try {
                    result = await fetchWithTimeout(
                        fetchImpl,
                        `${origin}${CONFIRM_PATH}`,
                        {
                            method: 'POST',
                            credentials: 'include',
                            cache: 'no-store',
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                token: normalizedToken,
                                newPassword: normalizedPassword
                            })
                        }
                    );
                } catch (_) {
                    throw new PasswordResetPageError('SERVICE_UNAVAILABLE');
                }

                if (result && result.status === 400) {
                    throw new PasswordResetPageError('INVALID_OR_EXPIRED_RESET');
                }
                if (!result || result.status !== 200) {
                    throw new PasswordResetPageError('SERVICE_UNAVAILABLE');
                }

                let payload;
                try {
                    payload = await result.json();
                } catch (_) {
                    throw new PasswordResetPageError('SERVICE_UNAVAILABLE');
                }
                if (!payload || payload.passwordReset !== true ||
                    Object.keys(payload).length !== 1) {
                    throw new PasswordResetPageError('SERVICE_UNAVAILABLE');
                }
            }
        };
    }

    function createPasswordResetController({ documentRef, client, token } = {}) {
        const elementIds = [
            'reset-form',
            'new-password',
            'confirm-password',
            'submit-button',
            'form-view',
            'invalid-view',
            'success-view',
            'status-message',
            'error-message'
        ];
        if (!documentRef || typeof documentRef.getElementById !== 'function' ||
            !client || typeof client.confirmPassword !== 'function') {
            throw new PasswordResetPageError('INVALID_CONTROLLER_CONFIG');
        }

        const elements = {};
        for (const id of elementIds) {
            elements[id] = documentRef.getElementById(id);
            if (!elements[id]) {
                throw new PasswordResetPageError('INVALID_CONTROLLER_CONFIG');
            }
        }
        if (typeof elements['reset-form'].addEventListener !== 'function') {
            throw new PasswordResetPageError('INVALID_CONTROLLER_CONFIG');
        }

        let resetToken = normalizeResetToken(token);
        let submitting = false;

        function setDisabled(disabled) {
            elements['submit-button'].disabled = disabled;
            elements['new-password'].disabled = disabled;
            elements['confirm-password'].disabled = disabled;
        }

        function clearPasswords() {
            elements['new-password'].value = '';
            elements['confirm-password'].value = '';
        }

        function showForm() {
            elements['form-view'].hidden = false;
            elements['invalid-view'].hidden = true;
            elements['success-view'].hidden = true;
        }

        function showTerminalState(viewId, message) {
            clearPasswords();
            resetToken = null;
            elements['form-view'].hidden = true;
            elements['invalid-view'].hidden = viewId !== 'invalid-view';
            elements['success-view'].hidden = viewId !== 'success-view';
            elements['error-message'].textContent = '';
            elements['status-message'].textContent = message;
        }

        async function submit() {
            if (submitting || !resetToken) return;

            elements['error-message'].textContent = '';
            const password = elements['new-password'].value;
            if (password !== elements['confirm-password'].value) {
                elements['error-message'].textContent = 'The passwords do not match.';
                return;
            }
            try {
                validateNewPassword(password);
            } catch (_) {
                elements['error-message'].textContent =
                    'Use a password between 8 and 128 characters.';
                return;
            }

            submitting = true;
            setDisabled(true);
            elements['status-message'].textContent = 'Resetting your password.';
            try {
                await client.confirmPassword({
                    token: resetToken,
                    newPassword: password
                });
                showTerminalState('success-view', 'Your password has been reset.');
            } catch (error) {
                if (error instanceof PasswordResetPageError &&
                    error.code === 'INVALID_OR_EXPIRED_RESET') {
                    showTerminalState(
                        'invalid-view',
                        'This password reset link is invalid or has expired.'
                    );
                } else {
                    showForm();
                    elements['status-message'].textContent = 'Choose a new password.';
                    elements['error-message'].textContent =
                        'We could not reset your password. Please try again.';
                }
            } finally {
                submitting = false;
                if (resetToken) setDisabled(false);
            }
        }

        showForm();
        setDisabled(false);
        elements['error-message'].textContent = '';
        elements['status-message'].textContent = 'Choose a new password.';
        elements['reset-form'].addEventListener('submit', event => {
            event.preventDefault();
            return submit();
        });

        return { submit };
    }

    function showInvalidResetLink(documentRef) {
        const ids = [
            'new-password',
            'confirm-password',
            'submit-button',
            'form-view',
            'invalid-view',
            'success-view',
            'status-message',
            'error-message'
        ];
        if (!documentRef || typeof documentRef.getElementById !== 'function') {
            throw new PasswordResetPageError('INVALID_CONTROLLER_CONFIG');
        }

        const elements = {};
        for (const id of ids) {
            elements[id] = documentRef.getElementById(id);
            if (!elements[id]) {
                throw new PasswordResetPageError('INVALID_CONTROLLER_CONFIG');
            }
        }

        elements['new-password'].value = '';
        elements['confirm-password'].value = '';
        elements['new-password'].disabled = true;
        elements['confirm-password'].disabled = true;
        elements['submit-button'].disabled = true;
        elements['form-view'].hidden = true;
        elements['invalid-view'].hidden = false;
        elements['success-view'].hidden = true;
        elements['error-message'].textContent = '';
        elements['status-message'].textContent =
            'This password reset link is invalid or has expired.';
    }

    function startPasswordResetPage({
        documentRef,
        locationRef,
        historyRef,
        fetchImpl
    } = {}) {
        let token;
        try {
            token = consumeResetToken({ locationRef, historyRef });
        } catch (error) {
            if (error instanceof PasswordResetPageError &&
                error.code === 'INVALID_RESET_TOKEN') {
                showInvalidResetLink(documentRef);
                return null;
            }
            throw error;
        }

        const client = createPasswordResetClient({ fetchImpl });
        return createPasswordResetController({ documentRef, client, token });
    }

    return {
        DEFAULT_API_ORIGIN,
        PasswordResetPageError,
        consumeResetToken,
        validateNewPassword,
        createPasswordResetClient,
        createPasswordResetController,
        startPasswordResetPage
    };
}));
