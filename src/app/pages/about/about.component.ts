import { Component, OnInit } from '@angular/core';
import { AboutPageContent } from '../../core/models/cms.models';
import { CommunityApiService } from '../../core/services/community-api.service';
import { CommunityBackendService } from '../../core/services/community-backend.service';

@Component({
  selector: 'app-about',
  standalone: true,
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {
  pageContent: AboutPageContent = {
    bannerKicker: 'Our roots. Our shared future.',
    bannerTitle: 'A community shaped by faith and belonging.',
    bannerDescription: 'Vaishnav Samaj is more than a shared name — it is a living bond between families, generations and values.',
    introTitle: 'A tradition of togetherness',
    introParagraph1: 'Across generations, Vaishnav families have held close to a simple belief: that faith is strengthened by compassion, family by respect and community by showing up for one another. Our Samaj is a place to honour that belief.',
    introParagraph2: 'We bring members together to celebrate our cultural heritage, support one another through life’s milestones and create meaningful opportunities for the next generation.',
    quote: 'Our identity is not only what we inherit — it is what we choose to share.'
  };
  loadError = '';

  constructor(private readonly api: CommunityApiService, private readonly backend: CommunityBackendService) {}

  ngOnInit(): void {
    if (this.api.isConfigured) void this.loadPageContent();
  }

  private async loadPageContent(): Promise<void> {
    try {
      this.pageContent = await this.backend.getPageContent<AboutPageContent>('about');
    } catch (error: unknown) {
      this.loadError = error instanceof Error ? error.message : 'Unable to load About page content.';
    }
  }
}
