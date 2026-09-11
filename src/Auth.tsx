// Auth.tsx
export interface IAuthState {
  isAuthenticated: boolean;
  username: string | null;
  role: 'admin' | 'user' | null;
  codePerson: string | null;
  personName?: string | null;
  displayName?: string | null;
  avatar?: string | null;     // Avatar riêng của tài khoản trong hệ thống
  photoURL?: string | null;   // Avatar từ Google
  email?: string | null;
  loginTime: string | null;
}

const AUTH_STORAGE_KEY = 'nasani_fund_auth_state';

export class Auth {
  private state: IAuthState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): IAuthState {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load auth state from storage:', e);
    }
    return {
      isAuthenticated: false,
      username: null,
      role: null,
      codePerson: null,
      personName: null,
      displayName: null,
      avatar: null,
      photoURL: null,
      email: null,
      loginTime: null
    };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save auth state to storage:', e);
    }
  }

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  // Đăng nhập
  login(
    username: string,
    role: 'admin' | 'user',
    codePerson: string,
    extra?: {
      personName?: string | null;
      displayName?: string | null;
      avatar?: string | null;
      photoURL?: string | null;
      email?: string | null;
    }
  ): void {
    this.state = {
      isAuthenticated: true,
      username,
      role,
      codePerson,
      personName: extra?.personName || username,
      displayName: extra?.displayName || username,
      avatar: extra?.avatar || null,
      photoURL: extra?.photoURL || null,
      email: extra?.email || username,
      loginTime: new Date().toISOString()
    };
    this.saveToStorage();
  }

  // Đăng xuất
  logout(): void {
    this.state = {
      isAuthenticated: false,
      username: null,
      role: null,
      codePerson: null,
      personName: null,
      displayName: null,
      photoURL: null,
      email: null,
      loginTime: null
    };
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear auth storage:', e);
    }
  }

  // Lấy thông tin user hiện tại
  getCurrentUser(): IAuthState | null {
    if (!this.state.isAuthenticated) {
      return null;
    }
    return { ...this.state };
  }

  // Lấy username
  getUsername(): string | null {
    return this.state.displayName || this.state.username || 'User';
  }

  // Lấy role
  getRole(): 'admin' | 'user' | null {
    return this.state.role;
  }

  // Lấy codePerson
  getCodePerson(): string | null {
    return this.state.codePerson;
  }

  // Kiểm tra có phải admin không
  isAdmin(): boolean {
    return this.state.role === 'admin';
  }

  // Kiểm tra có phải user không
  isUser(): boolean {
    return this.state.role === 'user';
  }

  // Lấy thời gian đăng nhập
  getLoginTime(): string | null {
    return this.state.loginTime;
  }

  // Cập nhật thông tin user hiện tại (ví dụ: avatar mới)
  updateUser(partial: Partial<IAuthState>): void {
    this.state = {
      ...this.state,
      ...partial
    };
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: this.state }));
    }
  }

  // Lấy toàn bộ state
  getState(): IAuthState {
    return { ...this.state };
  }
}

// Global singleton auth instance
export const auth = new Auth();