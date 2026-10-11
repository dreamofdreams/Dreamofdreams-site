'use strict';
(function () {
    const signup = document.getElementById('choose-signup');
    const login = document.getElementById('choose-login');
    if (!signup || !login) return;
    function choose(mode) {
        const creating = mode === 'signup';
        document.getElementById('signup-panel').hidden = !creating;
        document.getElementById('login-panel').hidden = creating;
        document.getElementById('tiktok-signup').hidden = !creating;
        document.getElementById('tiktok-login').hidden = creating;
        document.getElementById('social-options-title').textContent = creating ? 'Or sign up with' : 'Or log in with';
        signup.setAttribute('aria-pressed', String(creating));
        login.setAttribute('aria-pressed', String(!creating));
        signup.className = creating ? 'primary-button' : 'secondary-button';
        login.className = creating ? 'secondary-button' : 'primary-button';
    }
    signup.addEventListener('click', function () { choose('signup'); });
    login.addEventListener('click', function () { choose('login'); });
    choose(location.hash === '#signup' ? 'signup' : 'login');
})();