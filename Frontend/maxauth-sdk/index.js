/**
 * MaxAuth JavaScript SDK
 * 
 * Provides an easy interface to interact with the MaxAuth backend.
 */

class MaxAuth {
  /**
   * Initialize the MaxAuth SDK
   * @param {Object} config - Configuration object
   * @param {string} config.baseUrl - The URL of your MaxAuth backend (e.g. "http://localhost:5000")
   * @param {string} config.apiKey - The Project API Key (mxa_...)
   * @param {Object} [config.firebaseAuth] - The Firebase Auth instance initialized in the client
   */
  constructor(config = {}) {
    if (!config.baseUrl) throw new Error("MaxAuth SDK requires a baseUrl");
    if (!config.apiKey) throw new Error("MaxAuth SDK requires an apiKey");
    
    // Normalize base URL
    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
    this.apiKey = config.apiKey;
    this.firebaseAuth = config.firebaseAuth || null;
    
    // Attempt to load token from localStorage if available (browser context)
    if (typeof window !== 'undefined' && window.localStorage) {
      this.accessToken = localStorage.getItem('maxauth_access_token') || null;
      this.refreshToken = localStorage.getItem('maxauth_refresh_token') || null;
    } else {
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  /**
   * Internal helper to make API requests
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...options.headers
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API Error');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save tokens to local storage in browser environments
   */
  _persistTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    if (refreshToken) this.refreshToken = refreshToken;

    if (typeof window !== 'undefined' && window.localStorage) {
      if (accessToken) localStorage.setItem('maxauth_access_token', accessToken);
      if (refreshToken) localStorage.setItem('maxauth_refresh_token', refreshToken);
    }
  }

  /**
   * Send a Magic Link to a user's email
   * @param {string} email - User's email address
   * @returns {Promise<Object>} API Response
   */
  async signInWithMagicLink(email) {
    if (!email) throw new Error("Email is required");
    return this._request('/api/auth/send-magiclink', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Complete Magic Link sign in using the token from the URL
   * @param {string} token - Token from URL query parameters
   * @returns {Promise<Object>} User object and tokens
   */
  async verifyMagicLink(token) {
    if (!token) throw new Error("Token is required");
    const data = await this._request('/api/auth/verify-magiclink', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    
    if (data.success && data.data) {
      this._persistTokens(data.data.accessToken, data.data.refreshToken);
    }
    
    return data;
  }

  /**
   * Send an OTP to a user's email
   * @param {string} email - User's email address
   */
  async sendOTP(email) {
    if (!email) throw new Error("Email is required");
    return this._request('/api/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Verify an Email OTP
   * @param {string} email - User's email address
   * @param {string} code - The 6-digit code
   * @returns {Promise<Object>} User object and tokens
   */
  async verifyOTP(email, code) {
    if (!email || !code) throw new Error("Email and code are required");
    const data = await this._request('/api/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });

    if (data.success && data.data) {
      this._persistTokens(data.data.accessToken, data.data.refreshToken);
    }
    
    return data;
  }

  /**
   * Start Firebase Phone Authentication by sending an SMS
   * @param {string} phoneNumber - The user's phone number with country code (e.g., +1234567890)
   * @param {Object} recaptchaVerifier - Firebase RecaptchaVerifier instance
   * @returns {Promise<Object>} Firebase confirmationResult
   */
  async signInWithPhone(phoneNumber, recaptchaVerifier) {
    if (!this.firebaseAuth) {
      throw new Error("firebaseAuth instance not provided to SDK constructor");
    }
    if (!phoneNumber) throw new Error("Phone number is required");
    if (!recaptchaVerifier) throw new Error("Recaptcha verifier is required");

    // This calls Firebase Client SDK method directly
    return this.firebaseAuth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
  }

  /**
   * Verify Firebase Phone OTP and exchange ID token for MaxAuth session
   * @param {Object} confirmationResult - The result returned from signInWithPhone
   * @param {string} code - The verification code sent via SMS
   * @returns {Promise<Object>} User object and tokens
   */
  async verifyPhoneOTP(confirmationResult, code) {
    if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
      throw new Error("Valid confirmationResult is required");
    }
    if (!code) throw new Error("Code is required");

    // 1. Confirm code with Firebase Client SDK
    const userCredential = await confirmationResult.confirm(code);
    
    // 2. Extract Firebase ID token
    const idToken = await userCredential.user.getIdToken();

    // 3. Send ID token to MaxAuth backend to create session
    const data = await this._request('/api/otp/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    });

    if (data.success && data.data) {
      this._persistTokens(data.data.accessToken, data.data.refreshToken);
    }

    return data;
  }

  /**
   * Request an MFA Challenge (Triggers sending the actual code like SMS or email via backend)
   * @param {string} mfaToken - The intermediate mfaToken returned from first factor login
   * @returns {Promise<Object>} confirmation that challenge was sent
   */
  async requestMFAChallenge(mfaToken) {
    if (!mfaToken) throw new Error("mfaToken is required");
    return this._request('/api/mfa/challenge', {
      method: 'POST',
      body: JSON.stringify({ mfaToken })
    });
  }

  /**
   * Complete MFA by verifying the secondary factor code
   * @param {string} mfaToken - The intermediate mfaToken
   * @param {string} code - The code from SMS, Authenticator app or email
   * @returns {Promise<Object>} User object and final tokens
   */
  async handleMFAChallenge(mfaToken, code) {
    if (!mfaToken || !code) throw new Error("mfaToken and code are required");
    const data = await this._request('/api/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ mfaToken, code })
    });
    
    if (data.success && data.data && data.data.accessToken) {
      this._persistTokens(data.data.accessToken, data.data.refreshToken);
    }
    
    return data;
  }

  /**
   * Fetch details about the currently authenticated user
   */
  async getSession() {
    if (!this.accessToken) {
      throw new Error("No access token found. Please sign in first.");
    }
    
    return this._request('/api/auth/me', {
      method: 'GET'
    });
  }

  /**
   * Sign out the user and revoke their current session/tokens
   */
  async signOut() {
    if (!this.accessToken || !this.refreshToken) {
      return { success: true, message: "Already signed out" };
    }

    try {
      const data = await this._request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      // Clear local state regardless of server result
      this.accessToken = null;
      this.refreshToken = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('maxauth_access_token');
        localStorage.removeItem('maxauth_refresh_token');
      }

      return data;
    } catch (error) {
      // Clear local state anyway
      this.accessToken = null;
      this.refreshToken = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('maxauth_access_token');
        localStorage.removeItem('maxauth_refresh_token');
      }
      throw error;
    }
  }
}

export default MaxAuth;
