import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GalleryItem } from '../../core/models/cms.models';
import { CommunityApiService } from '../../core/services/community-api.service';
import { CommunityBackendService } from '../../core/services/community-backend.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent implements OnInit {
  selectedCategory = 'All moments';
  readonly categories = ['All moments', 'Celebrations', 'Community', 'Culture'];
  items: GalleryItem[] = [
    { title: 'Festival of lights', category: 'Celebrations', image: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1000&q=85', shape: 'wide' },
    { title: 'Together is our favourite place', category: 'Community', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=85', shape: 'tall' },
    { title: 'A night of colour & joy', category: 'Culture', image: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=900&q=85', shape: '' },
    { title: 'Making memories together', category: 'Community', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85', shape: '' },
    { title: 'Traditions that bring us home', category: 'Celebrations', image: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=900&q=85', shape: 'tall' },
    { title: 'Our heritage, our pride', category: 'Culture', image: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1000&q=85', shape: 'wide' }
  ];
  isLoading = false;
  demoMode = true;
  loadError = '';

  constructor(private readonly api: CommunityApiService, private readonly backend: CommunityBackendService) {}

  ngOnInit(): void {
    if (!this.api.isConfigured) return;
    this.demoMode = false;
    this.items = [];
    this.isLoading = true;
    void this.loadGallery();
  }

  private async loadGallery(): Promise<void> {
    try {
      this.items = await this.backend.getPublicGallery();
    } catch (error: unknown) {
      this.loadError = error instanceof Error ? error.message : 'Unable to load the community gallery.';
    } finally {
      this.isLoading = false;
    }
  }

  get visibleItems(): GalleryItem[] {
    return this.selectedCategory === 'All moments' ? this.items : this.items.filter(item => item.category === this.selectedCategory);
  }
}
