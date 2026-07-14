import { routes } from './app.routes';

describe('app routes', () => {
  it('exposes the expected top-level user journeys', () => {
    const paths = routes.map(route => route.path);

    expect(paths).toContain('');
    expect(paths).toContain('login');
    expect(paths).toContain('register');
    expect(paths).toContain('system');
    expect(paths).toContain('habits');
    expect(paths).toContain('life');
    expect(paths).toContain('ai');
    expect(paths).toContain('achievements');
    expect(paths).toContain('notifications');
    expect(paths).toContain('insights');
  });

  it('protects every app page except auth entry points', () => {
    const publicPaths = new Set(['', 'login', 'register', '**']);
    const protectedRoutes = routes.filter(route => !publicPaths.has(route.path ?? ''));

    expect(protectedRoutes.length).toBeGreaterThan(0);
    protectedRoutes.forEach(route => {
      expect(route.canActivate?.length).toBeGreaterThan(0);
    });
  });
});
