import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { authService } from './auth.service';

const INACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 minutes in milliseconds
const TOKEN_EXPIRY_TIME = 3600 * 1000; // 1 hour in milliseconds
const REFRESH_BEFORE_EXPIRY = 10 * 60 * 1000; // Refresh 10 minutes before expiry
const LAST_ACTIVITY_KEY = 'last-activity-timestamp';
const TOKEN_TIMESTAMP_KEY = 'token-timestamp';

const logTokenRefresh = (action: string, data: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[TokenRefreshService ${timestamp}] ${action}:`, JSON.stringify(data, null, 2));
};

class TokenRefreshService {
  private refreshInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private authStore: any = null;

  /**
   * Initialize the token refresh service
   */
  initialize(authStore: any) {
    this.authStore = authStore;
    logTokenRefresh('INITIALIZE', { hasAuthStore: !!authStore });

    // Update last activity timestamp
    this.updateLastActivity();

    // Set up app state listener
    this.setupAppStateListener();

    // Start auto-refresh timer
    this.startAutoRefresh();
  }

  /**
   * Clean up listeners and timers
   */
  cleanup() {
    logTokenRefresh('CLEANUP', {});
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Update the last activity timestamp
   */
  async updateLastActivity() {
    const now = Date.now();
    await AsyncStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    logTokenRefresh('UPDATE_ACTIVITY', { timestamp: new Date(now).toISOString() });
  }

  /**
   * Get the last activity timestamp
   */
  async getLastActivity(): Promise<number> {
    const timestamp = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
    return timestamp ? parseInt(timestamp, 10) : Date.now();
  }

  /**
   * Store token timestamp when token is created/refreshed
   */
  async storeTokenTimestamp() {
    const now = Date.now();
    await AsyncStorage.setItem(TOKEN_TIMESTAMP_KEY, now.toString());
    logTokenRefresh('STORE_TOKEN_TIMESTAMP', { timestamp: new Date(now).toISOString() });
  }

  /**
   * Get token timestamp
   */
  async getTokenTimestamp(): Promise<number> {
    const timestamp = await AsyncStorage.getItem(TOKEN_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : Date.now();
  }

  /**
   * Check if token needs refresh based on age
   */
  async shouldRefreshToken(): Promise<boolean> {
    const tokenTimestamp = await this.getTokenTimestamp();
    const now = Date.now();
    const tokenAge = now - tokenTimestamp;
    const shouldRefresh = tokenAge >= (TOKEN_EXPIRY_TIME - REFRESH_BEFORE_EXPIRY);

    logTokenRefresh('CHECK_TOKEN_AGE', {
      tokenTimestamp: new Date(tokenTimestamp).toISOString(),
      tokenAgeMinutes: Math.floor(tokenAge / 60000),
      shouldRefresh,
      refreshThresholdMinutes: Math.floor((TOKEN_EXPIRY_TIME - REFRESH_BEFORE_EXPIRY) / 60000),
    });

    return shouldRefresh;
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<boolean> {
    try {
      if (!this.authStore) {
        logTokenRefresh('REFRESH_ERROR', { error: 'No auth store available' });
        return false;
      }

      const { refreshToken, isAuthenticated } = this.authStore.getState();

      if (!isAuthenticated || !refreshToken) {
        logTokenRefresh('REFRESH_SKIPPED', { isAuthenticated, hasRefreshToken: !!refreshToken });
        return false;
      }

      logTokenRefresh('REFRESH_START', {
        refreshTokenLength: refreshToken.length,
      });

      const response = await authService.refreshToken(refreshToken);

      // Update auth store with new tokens
      this.authStore.getState().setAuth(
        response.user,
        response.idToken,
        response.refreshToken,
        response.sessionId
      );

      // Store new token timestamp
      await this.storeTokenTimestamp();
      await this.updateLastActivity();

      logTokenRefresh('REFRESH_SUCCESS', {
        newTokenLength: response.idToken.length,
        userId: response.userId,
      });

      return true;
    } catch (error) {
      logTokenRefresh('REFRESH_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Handle app state changes (foreground/background)
   */
  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      logTokenRefresh('APP_STATE_CHANGE', { state: nextAppState });

      if (nextAppState === 'active') {
        await this.handleAppResume();
      } else if (nextAppState === 'background') {
        await this.handleAppBackground();
      }
    });
  }

  /**
   * Handle app coming to foreground
   */
  private async handleAppResume() {
    try {
      const lastActivity = await this.getLastActivity();
      const now = Date.now();
      const inactiveTime = now - lastActivity;

      logTokenRefresh('APP_RESUME', {
        lastActivity: new Date(lastActivity).toISOString(),
        inactiveTimeMinutes: Math.floor(inactiveTime / 60000),
        inactivityThresholdMinutes: Math.floor(INACTIVITY_TIMEOUT / 60000),
      });

      // If inactive for more than 25 minutes, logout
      if (inactiveTime >= INACTIVITY_TIMEOUT) {
        logTokenRefresh('INACTIVITY_LOGOUT', {
          inactiveTimeMinutes: Math.floor(inactiveTime / 60000),
        });

        if (this.authStore) {
          this.authStore.getState().logout();
        }
        return;
      }

      // If inactive for less than 25 minutes, refresh token
      logTokenRefresh('REFRESH_ON_RESUME', {
        reason: 'App resumed after short inactivity',
      });

      await this.refreshToken();
    } catch (error) {
      logTokenRefresh('APP_RESUME_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle app going to background
   */
  private async handleAppBackground() {
    await this.updateLastActivity();
    logTokenRefresh('APP_BACKGROUND', {
      lastActivity: new Date().toISOString(),
    });
  }

  /**
   * Start automatic token refresh
   */
  private startAutoRefresh() {
    // Check every 5 minutes if token needs refresh
    this.refreshInterval = setInterval(async () => {
      const shouldRefresh = await this.shouldRefreshToken();
      
      if (shouldRefresh) {
        logTokenRefresh('AUTO_REFRESH_TRIGGERED', {
          reason: 'Token approaching expiry',
        });
        await this.refreshToken();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    logTokenRefresh('AUTO_REFRESH_STARTED', {
      checkIntervalMinutes: 5,
    });
  }
}

export const tokenRefreshService = new TokenRefreshService();
export default tokenRefreshService;
