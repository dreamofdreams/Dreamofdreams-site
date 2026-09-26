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

    function renderMedia(container, media, threadId) {
        container.replaceChildren();
        if (!media.length) container.append(element('p', 'board-muted', 'No media in this conversation yet.'));
        for (const entry of media) {
            const item = element('figure', 'board-media-item');
            const source = origin + '/community/discussions/media/file?threadId=' +
                encodeURIComponent(threadId) + '&id=' + encodeURIComponent(entry.id);
            const content = element(entry.type.startsWith('video/') ? 'video' : 'img');
            content.crossOrigin = 'use-credentials';
            if (entry.type.startsWith('video/')) {
                content.controls = true;
                content.preload = 'metadata';
            } else { content.alt = 'Media shared by ' + entry.author; content.loading = 'lazy'; }
            content.src = source;
            item.append(content);
            item.append(element('figcaption', 'board-meta', entry.author + ' · ' + formatDate(entry.createdAt) +
                (entry.allowTikTokReshare ? ' · TikTok resharing permitted by uploader' : '')));
            container.append(item);
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
        const mediaHeading = element('h4', 'board-media-heading', 'Member media');
        const mediaList = element('div', 'board-media-list');
        const upload = element('form', 'media-upload-form');
        const fileLabel = element('label', '', 'Add a photo or short video');
        const file = element('input');
        file.type = 'file';
        file.accept = 'image/jpeg,image/png,image/webp,video/mp4,video/webm';
        file.required = true;
        fileLabel.append(file);
        const shareLabel = element('label', 'media-share-option');
        const share = element('input');
        share.type = 'checkbox';
        shareLabel.append(share, doc.createTextNode(' Allow other members to share this media to TikTok when that feature is available'));
        const uploadButton = element('button', 'primary-button', 'Add media to discussion');
        uploadButton.type = 'submit';
        const uploadMessage = element('p', 'board-message');
        uploadMessage.setAttribute('role', 'status');
        upload.append(fileLabel, shareLabel, uploadButton, uploadMessage);
        detail.append(replies, form, mediaHeading, mediaList, upload);
        card.append(toggle, detail);

        async function loadReplies() {
            try {
                const result = await api('/community/discussions/replies?threadId=' + encodeURIComponent(thread.id));
                renderReplies(replies, result.replies);
            } catch (error) { replies.textContent = describeError(error); }
        }
        async function loadMedia() {
            try {
                const result = await api('/community/discussions/media?threadId=' + encodeURIComponent(thread.id));
                renderMedia(mediaList, result.media, thread.id);
            } catch (error) { mediaList.textContent = describeError(error); }
        }
        toggle.addEventListener('click', () => {
            detail.hidden = !detail.hidden;
            toggle.textContent = detail.hidden ? 'View replies' : 'Hide replies';
            if (!detail.hidden) { loadReplies(); loadMedia(); }
        });
        upload.addEventListener('submit', async event => {
            event.preventDefault();
            const selected = file.files[0];
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
            if (!selected || !validTypes.includes(selected.type) || selected.size > 20 * 1024 * 1024) {
                uploadMessage.textContent = 'Choose a JPEG, PNG, WebP, MP4 or WebM file of up to 20 MB.';
                return;
            }
            uploadButton.disabled = true;
            uploadMessage.textContent = 'Saving media to the reading room…';
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 120000);
            try {
                const response = await root.fetch(origin + '/community/discussions/media', {
                    method: 'POST', credentials: 'include', cache: 'no-store',
                    headers: { 'Content-Type': 'application/octet-stream', 'X-Media-Type': selected.type,
                        'X-Discussion-Thread': thread.id, 'X-Allow-TikTok-Reshare': String(share.checked) },
                    body: selected, signal: controller.signal
                });
                if (response.status === 401) throw new Error('LOGIN_REQUIRED');
                if (response.status === 429) throw new Error('PLEASE_WAIT');
                if (!response.ok) throw new Error('SERVICE_UNAVAILABLE');
                file.value = '';
                share.checked = false;
                uploadMessage.textContent = 'Media added to this discussion.';
                await loadMedia();
            } catch (error) { uploadMessage.textContent = describeError(error); }
            finally { clearTimeout(timeout); uploadButton.disabled = false; }
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
