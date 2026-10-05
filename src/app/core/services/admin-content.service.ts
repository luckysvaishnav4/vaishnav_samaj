import { Injectable } from '@angular/core';
import { Database } from '../models/database.types';
import {
  AdminOverview,
  CommunityGalleryRow,
  CommunityGotraRow,
  CommunityMemberModerationRow
} from '../models/cms.models';
import { CommunityApiService } from './community-api.service';

export type CommunityEventRow = Database['public']['Tables']['community_events']['Row'];
export type CommunityAnnouncementRow = Database['public']['Tables']['community_announcements']['Row'];
export type CommunityEventInput = Omit<Database['public']['Tables']['community_events']['Insert'], 'id' | 'created_at'>;
export type CommunityAnnouncementInput = Omit<Database['public']['Tables']['community_announcements']['Insert'], 'id' | 'created_at'>;

@Injectable({ providedIn: 'root' })
export class AdminContentService {
  constructor(private readonly api: CommunityApiService) {}

  getOverview(): Promise<AdminOverview> {
    return this.api.get<AdminOverview>('/admin/overview');
  }

  listEvents(): Promise<CommunityEventRow[]> {
    return this.api.get<CommunityEventRow[]>('/admin/events');
  }

  async saveEvent(input: CommunityEventInput, id?: string): Promise<void> {
    if (id) await this.api.put(`/admin/events/${encodeURIComponent(id)}`, input);
    else await this.api.post('/admin/events', input);
  }

  deleteEvent(id: string): Promise<void> {
    return this.api.delete(`/admin/events/${encodeURIComponent(id)}`);
  }

  listAnnouncements(): Promise<CommunityAnnouncementRow[]> {
    return this.api.get<CommunityAnnouncementRow[]>('/admin/announcements');
  }

  async saveAnnouncement(input: CommunityAnnouncementInput, id?: string): Promise<void> {
    if (id) await this.api.put(`/admin/announcements/${encodeURIComponent(id)}`, input);
    else await this.api.post('/admin/announcements', input);
  }

  deleteAnnouncement(id: string): Promise<void> {
    return this.api.delete(`/admin/announcements/${encodeURIComponent(id)}`);
  }

  listGotras(): Promise<CommunityGotraRow[]> {
    return this.api.get<CommunityGotraRow[]>('/admin/gotras');
  }

  async saveGotra(input: Omit<CommunityGotraRow, 'id' | 'members'>, id?: string): Promise<void> {
    if (id) await this.api.put(`/admin/gotras/${encodeURIComponent(id)}`, input);
    else await this.api.post('/admin/gotras', input);
  }

  deleteGotra(id: string): Promise<void> {
    return this.api.delete(`/admin/gotras/${encodeURIComponent(id)}`);
  }

  listGallery(): Promise<CommunityGalleryRow[]> {
    return this.api.get<CommunityGalleryRow[]>('/admin/gallery');
  }

  async saveGalleryItem(
    input: Omit<CommunityGalleryRow, 'id' | 'created_at'>,
    id?: string
  ): Promise<void> {
    if (id) await this.api.put(`/admin/gallery/${encodeURIComponent(id)}`, input);
    else await this.api.post('/admin/gallery', input);
  }

  deleteGalleryItem(id: string): Promise<void> {
    return this.api.delete(`/admin/gallery/${encodeURIComponent(id)}`);
  }

  listMembers(): Promise<CommunityMemberModerationRow[]> {
    return this.api.get<CommunityMemberModerationRow[]>('/admin/members');
  }

  async updateMember(
    id: string,
    changes: Partial<Pick<CommunityMemberModerationRow, 'is_approved' | 'is_suspended' | 'visibility'>>
  ): Promise<void> {
    await this.api.patch(`/admin/members/${encodeURIComponent(id)}`, changes);
  }

  deleteMember(id: string): Promise<void> {
    return this.api.delete(`/admin/members/${encodeURIComponent(id)}`);
  }

  getPage<T extends object>(key: 'home' | 'about' | 'contact'): Promise<T> {
    return this.api.get<T>(`/admin/pages/${key}`);
  }

  savePage<T extends object>(key: 'home' | 'about' | 'contact', content: T): Promise<T> {
    return this.api.put<T>(`/admin/pages/${key}`, content);
  }
}
