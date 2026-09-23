'use strict';

(function bootstrapPasswordResetPage(root) {
    function showUnavailable() {
        const documentRef = root && root.document;
        if (!documentRef || typeof documentRef.getElementById !== 'function') return;

        const formView = documentRef.getElementById('form-view');
        const invalidView = documentRef.getElementById('invalid-view');
        const successView = documentRef.getElementById('success-view');
        const statusMessage = documentRef.getElementById('status-message');
        const errorMessage = documentRef.getElementById('error-message');
        const newPassword = documentRef.getElementById('new-password');
        const confirmPassword = documentRef.getElementById('confirm-password');

        if (newPassword) newPassword.value = '';
        if (confirmPassword) confirmPassword.value = '';
        if (formView) formView.hidden = true;
        if (invalidView) invalidView.hidden = false;
        if (successView) successView.hidden = true;
        if (errorMessage) errorMessage.textContent = '';
        if (statusMessage) {
            statusMessage.textContent =
                'This password reset link is invalid or has expired.';
        }
    }

    const api = root && root.DreamPasswordReset;
    if (!api || typeof api.startPasswordResetPage !== 'function') {
        try {
            root.history.replaceState(
                null,
                '',
                `${root.location.pathname}${root.location.search}`
            );
        } catch (_) {
            // The generic fallback below does not expose configuration details.
        }
        showUnavailable();
        return;
    }

    try {
        api.startPasswordResetPage({
            documentRef: root.document,
            locationRef: root.location,
            historyRef: root.history,
            fetchImpl: (...args) => root.fetch(...args)
        });
    } catch (_) {
        showUnavailable();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this));
