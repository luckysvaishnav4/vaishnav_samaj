import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommunityDataService } from '../../core/services/community-data.service';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { CommunityBackendService } from '../../core/services/community-backend.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import { Gotra } from '../../core/models/community.models';

type ProfileGender = 'Man' | 'Woman' | 'Prefer not to say';

@Component({
  selector: 'app-register-profile',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register-profile.component.html',
  styleUrl: './register-profile.component.css'
})
export class RegisterProfileComponent implements OnInit {
  submitted = false;
  photoName = '';
  photoFile: File | null = null;
  isSubmitting = false;
  needsMemberLogin = false;
  isExistingAccount = false;
  existingProfile = false;
  error = '';
  info = '';
  profileGotras: Gotra[] = [];
  readonly maxDateOfBirth = this.getMaxDateOfBirth();
  profile = {
    fullName: '',
    gender: '' as '' | ProfileGender,
    dob: '',
    gotra: '',
    city: '',
    education: '',
    profession: '',
    about: '',
    family: '',
    email: '',
    phone: ''
  };

  constructor(
    readonly data: CommunityDataService,
    readonly api: CommunityApiService,
    private readonly auth: MemberAuthService,
    private readonly backend: CommunityBackendService
  ) {}

  ngOnInit(): void {
    this.profileGotras = this.data.gotras;
    if (this.api.isConfigured) {
      void this.checkExistingAccount();
      void this.loadGotras();
    }
  }

  private async loadGotras(): Promise<void> {
    try {
      const rows = await this.backend.getPublicGotras();
      this.profileGotras = rows.map((gotra) => ({ ...gotra, members: gotra.members ?? 0, isDemo: false }));
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to load gotra choices.';
    }
  }

  private async checkExistingAccount(): Promise<void> {
    try {
      this.isExistingAccount = Boolean(await this.auth.currentUserId());
      if (!this.isExistingAccount) return;
      this.profile.email = await this.auth.currentUserEmail() ?? '';
      this.existingProfile = Boolean(await this.backend.getOwnProfile());
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to check your account.';
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

  async submitProfile(): Promise<void> {
    if (this.isSubmitting) return;
    this.error = '';
    this.info = '';

    if (!this.api.isConfigured) {
      this.submitted = true;
      this.info = 'Demo only: the PostgreSQL API is not configured, so no information was submitted or saved.';
      return;
    }
    if (!this.profile.gender) {
      this.error = 'Choose a gender option to continue.';
      return;
    }

    this.isSubmitting = true;
    try {
      const profileData = {
        display_name: this.profile.fullName.trim(),
        gender: this.profile.gender,
        date_of_birth: this.profile.dob,
        gotra: this.profile.gotra,
        city: this.profile.city.trim(),
        education: this.profile.education.trim(),
        profession: this.profile.profession.trim(),
        about: this.profile.about.trim(),
        family_information: this.profile.family.trim(),
        phone: this.profile.phone.trim()
      };
      const hasSession = this.isExistingAccount || await this.auth.signUp(
        this.profile.email,
        this.password,
        profileData
      );

      let photoMessage = '';
      if (hasSession) {
        await this.backend.saveOwnProfile(profileData);
      }
      if (hasSession && this.photoFile) {
        try {
          await this.backend.uploadProfilePhoto(this.photoFile);
        } catch (error: unknown) {
          photoMessage = error instanceof Error ? ` Your profile was saved, but the photo was not uploaded: ${error.message}` : ' Your profile was saved, but the photo could not be uploaded.';
        }
      } else if (!hasSession && this.photoFile) {
        photoMessage = ' Sign in to upload your photo.';
      }

      this.submitted = true;
      this.needsMemberLogin = !hasSession;
      this.info = hasSession
        ? `Your account is ready and signed in. Your profile remains private until you choose to share it.${photoMessage}`
        : `Your profile was saved privately. Review its visibility in My Profile.${photoMessage}`;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to create your profile.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private getMaxDateOfBirth(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  password = '';
}
