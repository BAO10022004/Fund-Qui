// Auth.ts
export interface IAuthState {
  isAuthenticated: boolean;
  username: string | null;
  role: 'admin' | 'user' | null;
  codePerson: string | null;
  loginTime: Date | null;
}

export class Auth {
  private state: IAuthState = {
    isAuthenticated: false,
    username: null,
    role: null,
    codePerson: null,
    loginTime: null
  };

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  // Đăng nhập
  login(username: string, role: 'admin' | 'user', codePerson: string): void {
    this.state = {
      isAuthenticated: true,
      username,
      role,
      codePerson,
      loginTime: new Date()
    };
  }

  // Đăng xuất
  logout(): void {
    this.state = {
      isAuthenticated: false,
      username: null,
      role: null,
      codePerson: null,
      loginTime: null
    };
  }

  // Lấy thông tin user hiện tại
  getCurrentUser(): { username: string; role: 'admin' | 'user'; codePerson: string } | null {
    if (!this.state.isAuthenticated || !this.state.username || !this.state.role || !this.state.codePerson) {
      return null;
    }

    return {
      username: this.state.username,
      role: this.state.role,
      codePerson: this.state.codePerson
    };
  }

  // Lấy username
  getUsername(): string | null {
    return this.state.username;
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
  getLoginTime(): Date | null {
    return this.state.loginTime;
  }

  // Lấy toàn bộ state (để debug)
  getState(): IAuthState {
    return { ...this.state };
  }
}