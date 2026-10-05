import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AdminAuthService);

  try {
    return await auth.isCurrentUserAdmin() || router.createUrlTree(['/admin/login']);
  } catch {
    return router.createUrlTree(['/admin/login'], { queryParams: { verification: 'failed' } });
  }
};
