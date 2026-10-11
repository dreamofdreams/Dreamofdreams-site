'use strict';
(function () {
    const signup = document.getElementById('choose-signup');
    const login = document.getElementById('choose-login');
    if (!signup || !login) return;
    function choose(mode) {
        const creating = mode === 'signup';
        const loggingIn = mode === 'login';
        const reviewSignIn = document.getElementById('review-signin');
        const reviewForm = document.getElementById('book-review-form');
        if (reviewSignIn) reviewSignIn.hidden = (!creating && !loggingIn) || (reviewForm && !reviewForm.hidden);
        document.getElementById('social-auth-options').hidden = !creating && !loggingIn;
        document.getElementById('signup-panel').hidden = !creating;
        document.getElementById('login-panel').hidden = !loggingIn;
        document.getElementById('tiktok-signup').hidden = !creating;
        document.getElementById('tiktok-login').hidden = !loggingIn;
        document.getElementById('social-options-title').textContent = creating ? 'Or sign up with' : 'Or log in with';
        signup.setAttribute('aria-pressed', String(creating));
        login.setAttribute('aria-pressed', String(loggingIn));
        signup.className = creating ? 'primary-button' : 'secondary-button';
        login.className = loggingIn ? 'primary-button' : 'secondary-button';
    }
    signup.addEventListener('click', function () { choose('signup'); });
    login.addEventListener('click', function () { choose('login'); });
    choose(null);
})();