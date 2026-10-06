import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommunityDataService } from '../../core/services/community-data.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import { CommunityBackendService } from '../../core/services/community-backend.service';
import { CommunityEvent, Gotra, Announcement } from '../../core/models/community.models';
import { CommunityGotraRow, HomePageContent } from '../../core/models/cms.models';
import { ProfileCardComponent } from '../../shared/components/profile-card/profile-card.component';
import { GotraCardComponent } from '../../shared/components/gotra-card/gotra-card.component';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProfileCardComponent, GotraCardComponent, EventCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  gotras: Gotra[];
  events: CommunityEvent[];
  announcements: Announcement[];
  pageContent: HomePageContent = {
    kicker: 'OUR HERITAGE. OUR HOME.',
    titleLine1: 'Rooted in values.',
    titleLine2: 'Connected for life.',
    description: 'A welcoming home for Vaishnav families to celebrate our traditions, strengthen our bonds and shape the future together.'
  };
  demoMode = true;

  constructor(
    readonly data: CommunityDataService,
    private readonly api: CommunityApiService,
    private readonly backend: CommunityBackendService
  ) {
    this.gotras = data.gotras;
    this.events = data.events;
    this.announcements = data.announcements;
  }

  ngOnInit(): void {
    if (!this.api.isConfigured) return;
    this.demoMode = false;
    this.events = [];
    this.announcements = [];
    void this.loadCmsContent();
  }

  private async loadCmsContent(): Promise<void> {
    const results = await Promise.allSettled([
      this.backend.getPageContent<HomePageContent>('home'),
      this.backend.getPublicGotras(),
      this.backend.getUpcomingEvents(),
      this.backend.getPublishedAnnouncements()
    ]);
    if (results[0].status === 'fulfilled') this.pageContent = results[0].value;
    if (results[1].status === 'fulfilled') this.gotras = results[1].value.map((g: CommunityGotraRow) => ({ ...g, members: g.members ?? 0 } as Gotra));
    if (results[2].status === 'fulfilled') this.events = results[2].value;
    if (results[3].status === 'fulfilled') this.announcements = results[3].value;
  }
}
