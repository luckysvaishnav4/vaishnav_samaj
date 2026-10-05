import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  email = '';
  password = '';
  error = '';
  isSubmitting = false;

  constructor(
    private readonly auth: AdminAuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    readonly api: CommunityApiService
  ) {
    if (this.route.snapshot.queryParamMap.has('verification')) {
      this.error = 'We could not verify admin access. Sign in again or check that the community API is available.';
    }
  }

  async submit(): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.error = '';
    try {
      await this.auth.signIn(this.email, this.password);
      await this.router.navigateByUrl('/admin');
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to sign in.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
