import { Component, OnInit } from '@angular/core';
import { CommunityEvent } from '../../core/models/community.models';
import { CommunityBackendService } from '../../core/services/community-backend.service';
import { CommunityDataService } from '../../core/services/community-data.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [EventCardComponent],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  events: CommunityEvent[];
  demoMode = true;
  isLoading = false;
  loadError = '';
  configurationWarning = '';

  constructor(
    readonly data: CommunityDataService,
    private readonly backend: CommunityBackendService,
    private readonly api: CommunityApiService
  ) {
    this.events = data.events;
  }

  ngOnInit(): void {
    if (!this.api.isConfigured) {
      this.configurationWarning = this.api.configurationError ?? '';
      return;
    }

    this.demoMode = false;
    this.isLoading = true;
    void this.loadEvents();
  }

  private async loadEvents(): Promise<void> {
    try {
      this.events = await this.backend.getUpcomingEvents();
    } catch (error: unknown) {
      this.loadError = error instanceof Error ? error.message : 'Unable to load community events.';
    } finally {
      this.isLoading = false;
    }
  }
}
