import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Gotra } from '../../core/models/community.models';
import { CommunityApiService } from '../../core/services/community-api.service';
import { CommunityBackendService } from '../../core/services/community-backend.service';
import { CommunityDataService } from '../../core/services/community-data.service';
import { GotraCardComponent } from '../../shared/components/gotra-card/gotra-card.component';

@Component({
  selector: 'app-gotras',
  standalone: true,
  imports: [FormsModule, GotraCardComponent],
  templateUrl: './gotras.component.html',
  styleUrl: './gotras.component.css'
})
export class GotrasComponent implements OnInit {
  filtersOpen = false;
  searchTerm = '';
  selectedLetter = 'All';
  gotras: Gotra[];
  isLoading = false;
  loadError = '';
  demoMode = true;

  constructor(
    readonly data: CommunityDataService,
    private readonly api: CommunityApiService,
    private readonly backend: CommunityBackendService
  ) {
    this.gotras = data.gotras;
  }

  ngOnInit(): void {
    if (!this.api.isConfigured) return;
    this.demoMode = false;
    this.gotras = [];
    this.isLoading = true;
    void this.loadGotras();
  }

  private async loadGotras(): Promise<void> {
    try {
      const rows = await this.backend.getPublicGotras();
      this.gotras = rows.map((gotra) => ({ ...gotra, members: gotra.members ?? 0, isDemo: false }));
    } catch (error: unknown) {
      this.loadError = error instanceof Error ? error.message : 'Unable to load the gotra directory.';
    } finally {
      this.isLoading = false;
    }
  }

  get letters(): string[] {
    return ['All', ...new Set(this.gotras.map(gotra => [...gotra.name][0]))];
  }

  get filteredGotras(): Gotra[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.gotras.filter(gotra =>
      (!search || gotra.name.toLowerCase().includes(search) || gotra.description.toLowerCase().includes(search) || gotra.tradition.toLowerCase().includes(search)) &&
      (this.selectedLetter === 'All' || [...gotra.name][0] === this.selectedLetter)
    );
  }
}
