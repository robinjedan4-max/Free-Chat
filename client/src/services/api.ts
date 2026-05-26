import { ApiResponse } from '../../../server/src/utils/response';

const BASE_URL = '/api';

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      let response = await fetch(url, config);

      // Handle token expiration
      if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
        const refreshed = await this.handleTokenRefresh();
        if (refreshed) {
          // Retry the request with new token
          const retryHeaders = {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
            ...options.headers,
          };
          response = await fetch(url, { ...config, headers: retryHeaders });
        } else {
          // Redirect to auth / logout
          this.logoutAndRedirect();
          throw new Error('Session expired. Please login again.');
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error: any) {
      console.error(`API Client Error [${endpoint}]:`, error.message);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error,
      };
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const payload: ApiResponse = await res.json();
      if (payload.success && payload.data?.accessToken) {
        localStorage.setItem('accessToken', payload.data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private logoutAndRedirect() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-status-change'));
  }

  // --- Auth endpoints ---
  async register(body: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async login(body: any) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    this.logoutAndRedirect();
    if (!refreshToken) return { success: true, message: 'Logged out' };
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // --- User endpoints ---
  async getCreators(search = '', page = 1) {
    return this.request(`/users?search=${search}&page=${page}&limit=12`);
  }

  async getUserProfile(id: string) {
    return this.request(`/users/${id}`);
  }

  async getFriends() {
    return this.request('/users/friends');
  }

  async toggleFollow(id: string) {
    return this.request(`/users/follow/${id}`, { method: 'POST' });
  }

  async purchaseDiamonds(amount: number) {
    return this.request('/users/buy-diamonds', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async purchaseVIP(plan: 'VIP' | 'SVIP') {
    return this.request('/users/buy-vip', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  // --- Room endpoints ---
  async getRooms(category = '', type = '') {
    return this.request(`/rooms?category=${category}&type=${type}`);
  }

  async createRoom(body: any) {
    return this.request('/rooms/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async claimSeat(roomId: string, seatIndex: number) {
    return this.request('/rooms/seats/claim', {
      method: 'POST',
      body: JSON.stringify({ roomId, seatIndex }),
    });
  }

  async leaveSeat(roomId: string) {
    return this.request('/rooms/seats/leave', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    });
  }

  async closeRoom(id: string) {
    return this.request(`/rooms/${id}`, { method: 'DELETE' });
  }

  // --- Message endpoints ---
  async getRoomMessages(roomId: string) {
    return this.request(`/messages/room/${roomId}`);
  }

  async getDirectMessages(partnerId: string) {
    return this.request(`/messages/direct/${partnerId}`);
  }

  async sendDirectMessage(recipientId: string, content: string) {
    return this.request('/messages/direct', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content }),
    });
  }

  // --- Gift endpoints ---
  async getGifts() {
    return this.request('/gifts');
  }

  async sendGift(body: { giftId: string; recipientId: string; roomId?: string }) {
    return this.request('/gifts/send', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // --- Admin endpoints ---
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async toggleBanUser(userId: string, isBanned: boolean) {
    return this.request('/admin/users/ban', {
      method: 'POST',
      body: JSON.stringify({ userId, isBanned }),
    });
  }

  async generatePromoCodes() {
    return this.request('/admin/vip-codes', { method: 'POST' });
  }

  // --- Upload endpoints ---
  async uploadAvatar(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const response = await fetch(`${BASE_URL}/upload/avatar`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Avatar upload failed',
      };
    }
  }

  async uploadLogo(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const response = await fetch(`${BASE_URL}/upload/logo`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Logo upload failed',
      };
    }
  }

  async uploadBanner(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const response = await fetch(`${BASE_URL}/upload/banner`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Banner upload failed',
      };
    }
  }
}

export const api = new ApiClient();
export default api;
