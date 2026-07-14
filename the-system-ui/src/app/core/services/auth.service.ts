import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Player } from '../models/models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'system_access_token';
const REFRESH_KEY = 'system_refresh_token';
const PLAYER_KEY = 'system_player';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;

  readonly player = signal<Player | null>(this.loadPlayer());
  readonly isAuthenticated = computed(() => !!this.player());

  constructor(private http: HttpClient, private router: Router) {}

  register(body: { username: string; email: string; password: string; displayName?: string }):
    Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/register`, body).pipe(
      tap(res => this.persist(res)),
    );
  }

  login(body: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, body).pipe(
      tap(res => this.persist(res)),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(PLAYER_KEY);
    this.player.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Wipes every locally-stored trace of the account (tokens, cached status,
   * settings, custom directive) then routes back to login. Used after a
   * full account deletion so no stale data survives on the device.
   */
  purgeLocalAndLogout(): void {
    const keep = new Set<string>();
    // Clear all System-owned keys.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('system_') || key.startsWith('sys_') || keep.has(key)) {
        localStorage.removeItem(key);
      }
    }
    this.player.set(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  updatePlayer(player: Player): void {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
    this.player.set(player);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(PLAYER_KEY, JSON.stringify(res.player));
    this.player.set(res.player);
  }

  private loadPlayer(): Player | null {
    const raw = localStorage.getItem(PLAYER_KEY);
    return raw ? JSON.parse(raw) as Player : null;
  }
}

