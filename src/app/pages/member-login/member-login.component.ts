import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';

@Component({
  selector: 'app-member-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './member-login.component.html',
  styleUrl: './member-login.component.css'
})
export class MemberLoginComponent {
  email = '';
  password = '';
  error = '';
  isSubmitting = false;

  constructor(
    private readonly auth: MemberAuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    readonly api: CommunityApiService
  ) {}

  async submit(): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.error = '';
    try {
      await this.auth.signIn(this.email, this.password);
      const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
      const destination = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/my-profile';
      await this.router.navigateByUrl(destination);
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to sign in.';
    } finally {
      this.isSubmitting = false;
    }
  }

}
