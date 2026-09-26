'use strict';

(function initializeDiscussions(root) {
    if (!root || !root.document) return;
    const origin = 'https://dod-social-auth-gateway-190c9rby.uc.gateway.dev';
    const labels = {
        'reading-circle': 'The reading circle',
        'worlds-and-wonder': 'Worlds & wonder',
        'creators-corner': 'The creators’ corner'
    };
    const doc = root.document;
    const byId = id => doc.getElementById(id);

    function show(name, message) {
        for (const state of ['loading', 'signed-out', 'error', 'member']) {
            byId(state + '-view').hidden = state !== name;
        }
        byId('board-status').textContent = message;
    }

    async function api(path, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await root.fetch(origin + path, {
                credentials: 'include', cache: 'no-store',
                headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
                signal: controller.signal, ...options
            });
            if (response.status === 401) throw new Error('LOGIN_REQUIRED');
            if (response.status === 429) throw new Error('PLEASE_WAIT');
            if (!response.ok) throw new Error('SERVICE_UNAVAILABLE');
            return response.json();
        } finally { clearTimeout(timeout); }
    }

    function element(tag, className, content) {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (content !== undefined) node.textContent = content;
        return node;
    }

    function formatDate(timestamp) {
        return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleDateString() : '';
    }

    function describeError(error) {
        if (error.message === 'PLEASE_WAIT') return 'Please wait a moment before posting again.';
        if (error.message === 'LOGIN_REQUIRED') return 'Your session ended. Return to community login and try again.';
        return 'The discussion service is unavailable. Please try again.';
    }

    function renderReplies(container, replies) {
        container.replaceChildren();
        if (!replies.length) container.append(element('p', 'board-muted', 'Be the first to reply.'));
        for (const reply of replies) {
            const card = element('div', 'reply-card');
            card.append(element('p', 'board-meta', reply.author + ' · ' + formatDate(reply.createdAt)));
            card.append(element('p', 'board-text', reply.body));
            container.append(card);
        }
    }

    function renderThread(thread) {
        const card = element('article', 'thread-card');
        card.append(element('p', 'board-meta', (labels[thread.topic] || 'Discussion') + ' · ' + thread.author + ' · ' + formatDate(thread.createdAt)));
        card.append(element('h3', '', thread.title));
        card.append(element('p', 'board-text', thread.body));
        const toggle = element('button', 'secondary-button thread-toggle', 'View replies');
        toggle.type = 'button';
        const detail = element('div', 'thread-detail');
        detail.hidden = true;
        const replies = element('div', 'reply-list');
        const form = element('form', 'reply-form');
        const label = element('label', '', 'Write a reply');
        const input = element('textarea');
        input.required = true;
        input.maxLength = 2000;
        input.rows = 3;
        label.append(input);
        const submit = element('button', 'primary-button', 'Post reply');
        submit.type = 'submit';
        const message = element('p', 'board-message');
        message.setAttribute('role', 'status');
        form.append(label, submit, message);
        detail.append(replies, form);
        card.append(toggle, detail);

        async function loadReplies() {
            try {
                const result = await api('/community/discussions/replies?threadId=' + encodeURIComponent(thread.id));
                renderReplies(replies, result.replies);
            } catch (error) { replies.textContent = describeError(error); }
        }
        toggle.addEventListener('click', () => {
            detail.hidden = !detail.hidden;
            toggle.textContent = detail.hidden ? 'View replies' : 'Hide replies';
            if (!detail.hidden) loadReplies();
        });
        form.addEventListener('submit', async event => {
            event.preventDefault();
            submit.disabled = true;
            message.textContent = 'Posting your reply…';
            try {
                await api('/community/discussions/replies', {
                    method: 'POST', body: JSON.stringify({ threadId: thread.id, body: input.value })
                });
                input.value = '';
                message.textContent = 'Reply posted.';
                await loadReplies();
            } catch (error) { message.textContent = describeError(error); }
            finally { submit.disabled = false; }
        });
        return card;
    }

    async function loadThreads() {
        const list = byId('thread-list');
        list.textContent = 'Loading discussions…';
        try {
            const result = await api('/community/discussions/threads');
            list.replaceChildren();
            if (!result.threads.length) list.append(element('p', 'board-muted', 'Start the first discussion.'));
            for (const thread of result.threads) list.append(renderThread(thread));
        } catch (error) { list.textContent = describeError(error); }
    }

    async function refresh() {
        show('loading', 'Checking your community membership.');
        try {
            const response = await root.fetch(origin + '/community/auth/me', {
                method: 'GET', credentials: 'include', cache: 'no-store',
                headers: { Accept: 'application/json' }
            });
            if (response.status === 401) return show('signed-out', 'Log in to enter the reading room.');
            if (!response.ok) throw new Error('SERVICE_UNAVAILABLE');
            const profile = await response.json();
            const name = profile?.user?.displayName;
            if (profile.authenticated !== true || typeof name !== 'string' || !name.trim() ||
                !['email', 'google', 'tiktok'].includes(profile.user.provider)) throw new Error('INVALID_PROFILE');
            byId('member-name').textContent = name.trim();
            show('member', 'Welcome to the reading room, ' + name.trim() + '.');
            await loadThreads();
        } catch (_) { show('error', 'The reading room could not check your membership.'); }
    }

    function start() {
        byId('retry-button').addEventListener('click', refresh);
        byId('new-thread').addEventListener('submit', async event => {
            event.preventDefault();
            const button = event.currentTarget.querySelector('button[type=submit]');
            const message = byId('thread-message');
            button.disabled = true;
            message.textContent = 'Posting your discussion…';
            try {
                await api('/community/discussions/threads', {
                    method: 'POST', body: JSON.stringify({
                        topic: byId('thread-topic').value, title: byId('thread-title').value,
                        body: byId('thread-body').value
                    })
                });
                byId('thread-title').value = '';
                byId('thread-body').value = '';
                message.textContent = 'Your discussion is live.';
                await loadThreads();
            } catch (error) { message.textContent = describeError(error); }
            finally { button.disabled = false; }
        });
        refresh();
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})(typeof globalThis !== 'undefined' ? globalThis : this);
