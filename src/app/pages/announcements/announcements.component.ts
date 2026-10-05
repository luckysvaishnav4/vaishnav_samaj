import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Announcement } from '../../core/models/community.models';
import { CommunityBackendService } from '../../core/services/community-backend.service';
import { CommunityDataService } from '../../core/services/community-data.service';
import { CommunityApiService } from '../../core/services/community-api.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.css'
})
export class AnnouncementsComponent implements OnInit {
  announcements: Announcement[];
  isLoading = false;
  loadError = '';
  demoMode = true;

  constructor(
    readonly data: CommunityDataService,
    private readonly backend: CommunityBackendService,
    private readonly api: CommunityApiService
  ) {
    this.announcements = data.announcements;
  }

  ngOnInit(): void {
    if (!this.api.isConfigured) return;
    this.demoMode = false;
    this.isLoading = true;
    void this.loadAnnouncements();
  }

  private async loadAnnouncements(): Promise<void> {
    try {
      this.announcements = await this.backend.getPublishedAnnouncements();
    } catch (error: unknown) {
      this.loadError = error instanceof Error ? error.message : 'Unable to load announcements.';
    } finally {
      this.isLoading = false;
    }
  }
}
