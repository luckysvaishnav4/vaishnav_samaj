import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunityProfile } from '../../../core/models/community.models';
import { CommunityBackendService } from '../../../core/services/community-backend.service';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile-card.component.html',
  styleUrl: './profile-card.component.css'
})
export class ProfileCardComponent {
  @Input({ required: true }) profile!: CommunityProfile;
  interested = false;
  isSending = false;
  interestError = '';

  constructor(private readonly backend: CommunityBackendService) {}

  async sendInterest(): Promise<void> {
    if (this.profile.isDemo !== false) {
      this.interested = true;
      return;
    }

    if (this.isSending || this.interested) return;
    this.isSending = true;
    this.interestError = '';
    try {
      await this.backend.sendInterest(this.profile.id);
      this.interested = true;
    } catch (error: unknown) {
      this.interestError = error instanceof Error ? error.message : 'Unable to send interest.';
    } finally {
      this.isSending = false;
    }
  }
}
