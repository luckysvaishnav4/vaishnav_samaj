import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommunityProfile } from '../../core/models/community.models';
import { CommunityDataService } from '../../core/services/community-data.service';
import { CommunityBackendService } from '../../core/services/community-backend.service';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import { ProfileCardComponent } from '../../shared/components/profile-card/profile-card.component';

type MatchCategory = 'Recommended' | 'Boys' | 'Girls' | 'New profiles' | 'Recently active';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [FormsModule, ProfileCardComponent, RouterLink],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.css'
})
export class MatchesComponent implements OnInit {
  filtersOpen = false;
  selectedCategory: MatchCategory = 'Recommended';
  searchTerm = '';
  profiles: CommunityProfile[];
  demoMode = true;
  isLoading = false;
  signInRequired = false;
  loadError = '';
  readonly categories: MatchCategory[] = ['Recommended', 'Boys', 'Girls', 'New profiles', 'Recently active'];

  constructor(
    readonly data: CommunityDataService,
    private readonly backend: CommunityBackendService,
    private readonly auth: MemberAuthService,
    readonly api: CommunityApiService
  ) {
    this.profiles = data.profiles;
  }

  ngOnInit(): void {
    if (!this.api.isConfigured) return;
    this.demoMode = false;
    this.isLoading = true;
    void this.loadProfiles();
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
      this.loadError = error instanceof Error ? error.message : 'Unable to load matches.';
    } finally {
      this.isLoading = false;
    }
  }

  get filteredProfiles(): CommunityProfile[] {
    let profiles = [...this.profiles];
    if (this.selectedCategory === 'Boys') profiles = profiles.filter(profile => profile.gender === 'Man');
    if (this.selectedCategory === 'Girls') profiles = profiles.filter(profile => profile.gender === 'Woman');
    if (this.selectedCategory === 'New profiles') profiles = this.demoMode ? profiles.slice(-4).reverse() : profiles.slice(0, 4);
    if (this.selectedCategory === 'Recently active') profiles = profiles.filter(profile => profile.active);
    if (this.selectedCategory === 'Recommended' && this.demoMode) profiles = profiles.filter(profile => profile.verified);
    const search = this.searchTerm.trim().toLowerCase();
    return profiles.filter(profile => !search || `${profile.name} ${profile.city} ${profile.gotra} ${profile.profession}`.toLowerCase().includes(search));
  }

  selectCategory(category: MatchCategory): void {
    this.selectedCategory = category;
  }
}
