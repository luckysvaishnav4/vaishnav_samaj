import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommunityProfile } from '../../core/models/community.models';
import { CommunityDataService } from '../../core/services/community-data.service';
import { CommunityBackendService } from '../../core/services/community-backend.service';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile-details.component.html',
  styleUrl: './profile-details.component.css'
})
export class ProfileDetailsComponent implements OnInit {
  profile?: CommunityProfile;
  interestSent = false;
  isLoading = false;
  isSendingInterest = false;
  requiresSignIn = false;
  isOwnProfile = false;
  error = '';
  demoMode = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly data: CommunityDataService,
    private readonly backend: CommunityBackendService,
    private readonly auth: MemberAuthService,
    readonly api: CommunityApiService
  ) {}

  get profileId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!this.api.isConfigured) {
      this.profile = this.data.profiles.find(item => item.id === id);
      return;
    }
    this.demoMode = false;
    this.isLoading = true;
    void this.loadProfile(id);
  }

  private async loadProfile(id: string | null): Promise<void> {
    try {
      const currentUserId = await this.auth.currentUserId();
      if (!currentUserId) {
        this.requiresSignIn = true;
        return;
      }
      this.isOwnProfile = id === currentUserId;
      if (id) this.profile = (await this.backend.getProfile(id)) ?? undefined;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to load this profile.';
    } finally {
      this.isLoading = false;
    }
  }

  async sendInterest(): Promise<void> {
    if (!this.profile) return;
    if (this.profile.isDemo !== false) {
      this.interestSent = true;
      return;
    }
    this.isSendingInterest = true;
    this.error = '';
    try {
      await this.backend.sendInterest(this.profile.id);
      this.interestSent = true;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to send interest.';
    } finally {
      this.isSendingInterest = false;
    }
  }
}
