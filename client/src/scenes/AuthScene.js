/**
 * AuthScene — login/register UI rendered as an HTML overlay.
 */
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export default class AuthScene extends Phaser.Scene {
  constructor() {
    super('AuthScene');
  }

  create() {
    this._showAuthForm('login');
  }

  _showAuthForm(mode) {
    const overlay = document.getElementById('ui-overlay');
    overlay.classList.remove('hidden');

    const isLogin = mode === 'login';
    overlay.innerHTML = `
      <div class="panel">
        <h2>${isLogin ? '🛸 Welcome Back' : '🌌 Join AlienJam'}</h2>
        <p class="subtitle">${isLogin ? 'Log in to your alien account' : 'Create your alien account'}</p>
        <div class="error" id="auth-error"></div>
        <label>Username</label>
        <input type="text" id="auth-username" placeholder="coolalien42" maxlength="20" autocomplete="off" />
        <label>Password</label>
        <input type="password" id="auth-password" placeholder="${isLogin ? '••••••' : 'min. 6 characters'}" maxlength="64" />
        <button class="btn-primary" id="auth-submit">${isLogin ? 'Log In' : 'Create Account'}</button>
        <button class="btn-secondary" id="auth-toggle">
          ${isLogin ? "Don't have an account? Register" : 'Already have an account? Log in'}
        </button>
      </div>
    `;

    document.getElementById('auth-toggle').addEventListener('click', () => {
      this._showAuthForm(isLogin ? 'register' : 'login');
    });

    const submitBtn = document.getElementById('auth-submit');
    submitBtn.addEventListener('click', () => this._handleSubmit(isLogin));

    document.getElementById('auth-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleSubmit(isLogin);
    });

    // Focus username field
    setTimeout(() => document.getElementById('auth-username')?.focus(), 50);
  }

  async _handleSubmit(isLogin) {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');
    const submitBtn = document.getElementById('auth-submit');

    errorEl.classList.remove('visible');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait...';

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || 'Something went wrong';
        errorEl.classList.add('visible');
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'Log In' : 'Create Account';
        return;
      }

      // Save auth info
      localStorage.setItem('alienjam_token', data.token);
      localStorage.setItem('alienjam_username', data.username);
      localStorage.setItem('alienjam_userId', data.userId);

      document.getElementById('ui-overlay').classList.add('hidden');

      this.scene.start('CharCreateScene', {
        token: data.token,
        username: data.username,
        userId: data.userId,
        fromBoot: false
      });
    } catch {
      errorEl.textContent = 'Could not connect to server. Is it running?';
      errorEl.classList.add('visible');
      submitBtn.disabled = false;
      submitBtn.textContent = isLogin ? 'Log In' : 'Create Account';
    }
  }
}
