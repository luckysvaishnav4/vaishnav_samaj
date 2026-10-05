import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Database } from '../../core/models/database.types';
import { CommunityBackendService, InterestRequestRow } from '../../core/services/community-backend.service';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';

type MemberProfile = Database['public']['Tables']['community_profiles']['Row'];

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, TitleCasePipe],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnInit {
  profile: MemberProfile | null = null;
  visibility: 'private' | 'community' = 'private';
  shareConsent = false;
  isLoading = true;
  isSaving = false;
  isSignedIn = false;
  error = '';
  notice = '';
  interestRequests: InterestRequestRow[] = [];
  photoFile: File | null = null;
  photoName = '';

  constructor(
    readonly api: CommunityApiService,
    private readonly auth: MemberAuthService,
    private readonly backend: CommunityBackendService
  ) {}

  ngOnInit(): void {
    void this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      this.isSignedIn = Boolean(await this.auth.currentUserId());
      if (this.isSignedIn) {
        this.profile = await this.backend.getOwnProfile();
        if (this.profile) {
          this.visibility = this.profile.visibility;
          this.interestRequests = await this.backend.getMyInterestRequests();
        }
      }
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to load your profile.';
    } finally {
      this.isLoading = false;
    }
  }

  async saveVisibility(): Promise<void> {
    if (this.visibility === 'community' && !this.shareConsent) {
      this.error = 'Confirm that you want signed-in community members to view your profile information.';
      return;
    }
    this.isSaving = true;
    this.error = '';
    this.notice = '';
    try {
      await this.backend.setProfileVisibility(this.visibility, this.visibility === 'community' && this.shareConsent);
      if (this.profile) this.profile = { ...this.profile, visibility: this.visibility };
      this.shareConsent = false;
      this.notice = this.visibility === 'community'
        ? 'Your community profile is now visible to signed-in members. Contact details remain private.'
        : 'Your profile is private and will not appear in member or match directories.';
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to update profile privacy.';
    } finally {
      this.isSaving = false;
    }
  }

  async signOut(): Promise<void> {
    this.error = '';
    try {
      await this.auth.signOut();
      window.location.assign('/member-login');
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to sign out.';
    }
  }

  async respondToRequest(id: string, status: 'accepted' | 'declined'): Promise<void> {
    this.error = '';
    this.notice = '';
    try {
      await this.backend.respondToInterestRequest(id, status);
      this.notice = status === 'accepted' ? 'Interest request accepted.' : 'Interest request declined.';
      this.interestRequests = await this.backend.getMyInterestRequests();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to respond to interest request.';
    }
  }

  choosePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.error = 'Choose a JPEG, PNG, or WebP image.';
      input.value = '';
      this.photoFile = null;
      this.photoName = '';
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      this.error = 'Profile photos must be 5 MB or smaller.';
      input.value = '';
      this.photoFile = null;
      this.photoName = '';
      return;
    }
    this.error = '';
    this.photoFile = file;
    this.photoName = file?.name ?? '';
  }

  async uploadPhoto(): Promise<void> {
    if (!this.photoFile) return;
    this.error = '';
    this.notice = '';
    this.isSaving = true;
    try {
      await this.backend.uploadProfilePhoto(this.photoFile);
      this.profile = await this.backend.getOwnProfile();
      this.photoFile = null;
      this.photoName = '';
      this.notice = 'Your profile photo was uploaded to private storage.';
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to upload profile photo.';
    } finally {
      this.isSaving = false;
    }
  }
}
