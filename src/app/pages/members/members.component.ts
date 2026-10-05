import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommunityProfile } from '../../core/models/community.models';
import { CommunityDataService } from '../../core/services/community-data.service';
import { CommunityBackendService } from '../../core/services/community-backend.service';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import { ProfileCardComponent } from '../../shared/components/profile-card/profile-card.component';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [FormsModule, ProfileCardComponent, RouterLink],
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
})
export class MembersComponent implements OnInit {
  filtersOpen = false;
  searchTerm = '';
  gotra = '';
  city = '';
  gender = '';
  minAge = '';
  maxAge = '';
  profiles: CommunityProfile[];
  demoMode = true;
  isLoading = false;
  signInRequired = false;
  loadError = '';

  constructor(
    readonly data: CommunityDataService,
    private readonly route: ActivatedRoute,
    private readonly backend: CommunityBackendService,
    private readonly auth: MemberAuthService,
    readonly api: CommunityApiService
  ) {
    this.profiles = data.profiles;
  }

  ngOnInit(): void {
    this.gotra = this.route.snapshot.queryParamMap.get('gotra') ?? '';
    if (this.api.isConfigured) {
      this.demoMode = false;
      this.isLoading = true;
      void this.loadProfiles();
    }
  }

  private async loadProfiles(): Promise<void> {
    try {
      const userId = await this.auth.currentUserId();
      if (!userId) {
        this.profiles = [];
        this.signInRequired = true;
        return;
      }
      this.profiles = await this.backend.getCommunityProfiles();
    } catch (error: unknown) {
      this.loadError = error instanceof Error ? error.message : 'Unable to load community profiles.';
    } finally {
      this.isLoading = false;
    }
  }

  get cities(): string[] {
    return [...new Set(this.profiles.map(profile => profile.city))].sort();
  }

  get filteredProfiles(): CommunityProfile[] {
    const search = this.searchTerm.trim().toLowerCase();
    const min = this.minAge ? Number(this.minAge) : 0;
    const max = this.maxAge ? Number(this.maxAge) : Infinity;
    return this.profiles.filter(profile =>
      (!search || `${profile.name} ${profile.profession} ${profile.city} ${profile.gotra}`.toLowerCase().includes(search)) &&
      (!this.gotra || profile.gotra === this.gotra) &&
      (!this.city || profile.city === this.city) &&
      (!this.gender || profile.gender === this.gender) &&
      profile.age >= min && profile.age <= max
    );
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.gotra = '';
    this.city = '';
    this.gender = '';
    this.minAge = '';
    this.maxAge = '';
  }
}
