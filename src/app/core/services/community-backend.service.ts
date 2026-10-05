import { Injectable } from '@angular/core';
import { Announcement, CommunityEvent, CommunityProfile } from '../models/community.models';
import { CommunityGalleryRow, CommunityGotraRow } from '../models/cms.models';
import { Database } from '../models/database.types';
import { CommunityApiService } from './community-api.service';
import { MemberSignupProfile } from './member-auth.service';

type CommunityProfileRow = Database['public']['Tables']['community_profiles']['Row'];
export type InterestRequestRow = Database['public']['Tables']['interest_requests']['Row'];

@Injectable({ providedIn: 'root' })
export class CommunityBackendService {
  private readonly photoUrls = new Map<string, string>();

  constructor(private readonly api: CommunityApiService) {}

  getPublicGotras(): Promise<CommunityGotraRow[]> {
    return this.api.get<CommunityGotraRow[]>('/gotras');
  }

  async getPublicGallery(): Promise<Array<CommunityGalleryRow & { image: string }>> {
    const items = await this.api.get<CommunityGalleryRow[]>('/gallery');
    return items.map((item) => ({ ...item, image: item.image_url }));
  }

  getPageContent<T extends object>(key: 'home' | 'about' | 'contact'): Promise<T> {
    return this.api.get<T>(`/pages/${key}`);
  }

  async getCommunityProfiles(): Promise<CommunityProfile[]> {
    const rows = await this.api.get<CommunityProfileRow[]>('/profiles');
    return Promise.all(rows.map((row) => this.mapProfile(row)));
  }

  async getProfile(id: string): Promise<CommunityProfile | null> {
    try {
      const row = await this.api.get<CommunityProfileRow>(`/profiles/${encodeURIComponent(id)}`);
      return this.mapProfile(row);
    } catch (error: unknown) {
      if (error instanceof Error && /unavailable|not found/i.test(error.message)) return null;
      throw error;
    }
  }

  getOwnProfile(): Promise<CommunityProfileRow | null> {
    return this.api.get<CommunityProfileRow | null>('/profiles/me');
  }

  async setProfileVisibility(visibility: 'private' | 'community', shareConsent = false): Promise<void> {
    await this.api.patch('/profiles/me/visibility', { visibility, shareConsent });
  }

  async saveOwnProfile(profile: MemberSignupProfile): Promise<void> {
    await this.api.put('/profiles/me', profile);
  }

  async sendInterest(recipientId: string): Promise<void> {
    await this.api.post('/interests', { recipient_id: recipientId });
  }

  getMyInterestRequests(): Promise<InterestRequestRow[]> {
    return this.api.get<InterestRequestRow[]>('/interests');
  }

  async respondToInterestRequest(id: string, status: 'accepted' | 'declined'): Promise<void> {
    await this.api.patch(`/interests/${encodeURIComponent(id)}`, { status });
  }

  async uploadProfilePhoto(file: File): Promise<string> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Choose a JPEG, PNG, or WebP image.');
    }
    if (file.size > 5 * 1024 * 1024) throw new Error('Profile photos must be 5 MB or smaller.');
    const result = await this.api.upload<{ photo_path: string }>('/profiles/me/photo', 'photo', file);
    const oldUrl = this.photoUrls.get(result.photo_path);
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    return result.photo_path;
  }

  async getUpcomingEvents(): Promise<CommunityEvent[]> {
    const events = await this.api.get<Array<{
      title: string;
      description: string;
      starts_at: string;
      venue: string;
      category: string;
      image_url: string | null;
    }>>('/events');
    return events.map((event) => ({
      title: event.title,
      date: new Date(event.starts_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      venue: event.venue,
      category: event.category,
      description: event.description,
      image: event.image_url ?? ''
    }));
  }

  async getPublishedAnnouncements(): Promise<Announcement[]> {
    const announcements = await this.api.get<Array<{
      title: string;
      summary: string;
      published_at: string;
    }>>('/announcements');
    return announcements.map((item) => ({
      title: item.title,
      date: new Date(item.published_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      category: 'Samaj update',
      summary: item.summary
    }));
  }

  private async mapProfile(row: CommunityProfileRow): Promise<CommunityProfile> {
    let image = '';
    if (row.photo_path) {
      const existing = this.photoUrls.get(row.photo_path);
      image = existing ?? await this.api.getProtectedImage(`/profiles/${encodeURIComponent(row.id)}/photo`);
      this.photoUrls.set(row.photo_path, image);
    }

    const birthDate = new Date(`${row.date_of_birth}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) age--;

    return {
      id: row.id,
      name: row.display_name,
      gender: row.gender,
      age,
      city: row.city,
      gotra: row.gotra,
      education: row.education || 'Not shared',
      profession: row.profession || 'Not shared',
      introduction: row.about || 'No introduction shared yet.',
      image,
      verified: false,
      active: Date.now() - new Date(row.updated_at).getTime() <= 30 * 24 * 60 * 60 * 1000,
      family: row.family_information || 'Not shared',
      lifestyle: row.lifestyle || 'Not shared',
      isDemo: false,
      visibility: row.visibility
    };
  }
}
