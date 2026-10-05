import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminContentService,
  CommunityAnnouncementRow,
  CommunityEventRow
} from '../../core/services/admin-content.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import {
  AdminOverview,
  CommunityGalleryRow,
  CommunityGotraRow,
  CommunityMemberModerationRow
} from '../../core/models/cms.models';

type AdminSection = 'events' | 'announcements' | 'gotras' | 'gallery' | 'members' | 'pages';
type SitePageKey = 'home' | 'about' | 'contact';

interface PageField {
  key: string;
  label: string;
  multiline?: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  section: AdminSection = 'events';
  events: CommunityEventRow[] = [];
  announcements: CommunityAnnouncementRow[] = [];
  gotras: CommunityGotraRow[] = [];
  galleryItems: CommunityGalleryRow[] = [];
  members: CommunityMemberModerationRow[] = [];
  overview: AdminOverview = {
    members: 0,
    pending_profiles: 0,
    events: 0,
    announcements: 0,
    gotras: 0,
    gallery_items: 0
  };
  isLoading = true;
  isSaving = false;
  searchTerm = '';
  error = '';
  notice = '';
  editingEventId = '';
  editingAnnouncementId = '';
  editingGotraId = '';
  editingGalleryId = '';
  eventDraft = this.emptyEvent();
  announcementDraft = this.emptyAnnouncement();
  gotraDraft = this.emptyGotra();
  galleryDraft = this.emptyGalleryItem();
  pageKey: SitePageKey = 'home';
  pageDraft: Record<string, string> = {};
  pageFields: PageField[] = [];
  readonly pageOptions: Array<{ key: SitePageKey; label: string; fields: PageField[] }> = [
    { key: 'home', label: 'Homepage', fields: [
      { key: 'kicker', label: 'Hero eyebrow' },
      { key: 'titleLine1', label: 'First title line' },
      { key: 'titleLine2', label: 'Second title line' },
      { key: 'description', label: 'Hero introduction', multiline: true }
    ] },
    { key: 'about', label: 'About page', fields: [
      { key: 'bannerKicker', label: 'Banner eyebrow' },
      { key: 'bannerTitle', label: 'Banner headline' },
      { key: 'bannerDescription', label: 'Banner introduction', multiline: true },
      { key: 'introTitle', label: 'Community introduction title' },
      { key: 'introParagraph1', label: 'Community introduction — paragraph 1', multiline: true },
      { key: 'introParagraph2', label: 'Community introduction — paragraph 2', multiline: true },
      { key: 'quote', label: 'Community quote', multiline: true }
    ] },
    { key: 'contact', label: 'Contact page', fields: [
      { key: 'city', label: 'Office city' },
      { key: 'address', label: 'Office address' },
      { key: 'phone', label: 'Public office phone' },
      { key: 'phoneNote', label: 'Phone note' },
      { key: 'whatsapp', label: 'Public WhatsApp' },
      { key: 'whatsappNote', label: 'WhatsApp note' },
      { key: 'email', label: 'Public office email' },
      { key: 'emailNote', label: 'Email note' },
      { key: 'mapUrl', label: 'Google Maps URL' }
    ] }
  ];

  constructor(
    private readonly content: AdminContentService,
    private readonly auth: AdminAuthService
  ) {}

  ngOnInit(): void {
    void this.loadContent();
  }

  async loadContent(): Promise<void> {
    this.error = '';
    try {
      [
        this.events,
        this.announcements,
        this.gotras,
        this.galleryItems,
        this.members,
        this.overview
      ] = await Promise.all([
        this.content.listEvents(),
        this.content.listAnnouncements(),
        this.content.listGotras(),
        this.content.listGallery(),
        this.content.listMembers(),
        this.content.getOverview()
      ]);
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to load admin content.';
    } finally {
      this.isLoading = false;
    }
  }

  selectSection(section: AdminSection): void {
    this.section = section;
    this.notice = '';
    this.error = '';
    this.cancelEdit();
    if (section === 'pages') void this.loadPage();
  }

  editEvent(event: CommunityEventRow): void {
    this.section = 'events';
    this.editingEventId = event.id;
    this.eventDraft = {
      title: event.title,
      description: event.description,
      starts_at: this.toLocalDateTime(event.starts_at),
      venue: event.venue,
      category: event.category,
      image_url: event.image_url ?? '',
      is_published: event.is_published
    };
    this.notice = '';
    this.error = '';
  }

  async saveEvent(): Promise<void> {
    this.isSaving = true;
    this.error = '';
    this.notice = '';
    try {
      await this.content.saveEvent({
        ...this.eventDraft,
        starts_at: new Date(this.eventDraft.starts_at).toISOString(),
        image_url: this.eventDraft.image_url || null
      }, this.editingEventId || undefined);
      this.notice = this.editingEventId ? 'Event updated.' : 'Event saved.';
      this.eventDraft = this.emptyEvent();
      this.editingEventId = '';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to save event.';
    } finally {
      this.isSaving = false;
    }
  }

  async deleteEvent(event: CommunityEventRow): Promise<void> {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    this.error = '';
    this.notice = '';
    try {
      await this.content.deleteEvent(event.id);
      this.notice = 'Event deleted.';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to delete event.';
    }
  }

  editAnnouncement(item: CommunityAnnouncementRow): void {
    this.section = 'announcements';
    this.editingAnnouncementId = item.id;
    this.announcementDraft = {
      title: item.title,
      summary: item.summary,
      published_at: this.toLocalDateTime(item.published_at),
      is_published: item.is_published
    };
    this.notice = '';
    this.error = '';
  }

  async saveAnnouncement(): Promise<void> {
    this.isSaving = true;
    this.error = '';
    this.notice = '';
    try {
      await this.content.saveAnnouncement({
        ...this.announcementDraft,
        published_at: new Date(this.announcementDraft.published_at).toISOString()
      }, this.editingAnnouncementId || undefined);
      this.notice = this.editingAnnouncementId ? 'Announcement updated.' : 'Announcement saved.';
      this.announcementDraft = this.emptyAnnouncement();
      this.editingAnnouncementId = '';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to save announcement.';
    } finally {
      this.isSaving = false;
    }
  }

  async deleteAnnouncement(item: CommunityAnnouncementRow): Promise<void> {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    this.error = '';
    this.notice = '';
    try {
      await this.content.deleteAnnouncement(item.id);
      this.notice = 'Announcement deleted.';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to delete announcement.';
    }
  }

  editGotra(gotra: CommunityGotraRow): void {
    this.section = 'gotras';
    this.editingGotraId = gotra.id;
    this.gotraDraft = {
      name: gotra.name,
      tradition: gotra.tradition,
      description: gotra.description,
      is_published: gotra.is_published,
      sort_order: gotra.sort_order
    };
    this.error = '';
    this.notice = '';
  }

  async saveGotra(): Promise<void> {
    this.isSaving = true;
    this.error = '';
    this.notice = '';
    try {
      await this.content.saveGotra(this.gotraDraft, this.editingGotraId || undefined);
      this.notice = this.editingGotraId ? 'Gotra updated.' : 'Gotra added.';
      this.gotraDraft = this.emptyGotra();
      this.editingGotraId = '';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to save gotra.';
    } finally {
      this.isSaving = false;
    }
  }

  async deleteGotra(gotra: CommunityGotraRow): Promise<void> {
    if (!window.confirm(`Remove "${gotra.name}" from the public directory? Member profiles will keep their saved gotra text.`)) return;
    this.error = '';
    this.notice = '';
    try {
      await this.content.deleteGotra(gotra.id);
      this.notice = 'Gotra removed.';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to remove gotra.';
    }
  }

  editGalleryItem(item: CommunityGalleryRow): void {
    this.section = 'gallery';
    this.editingGalleryId = item.id;
    this.galleryDraft = {
      title: item.title,
      category: item.category,
      image_url: item.image_url,
      shape: item.shape,
      is_published: item.is_published
    };
    this.error = '';
    this.notice = '';
  }

  async saveGalleryItem(): Promise<void> {
    this.isSaving = true;
    this.error = '';
    this.notice = '';
    try {
      await this.content.saveGalleryItem(this.galleryDraft, this.editingGalleryId || undefined);
      this.notice = this.editingGalleryId ? 'Gallery item updated.' : 'Gallery item added.';
      this.galleryDraft = this.emptyGalleryItem();
      this.editingGalleryId = '';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to save gallery item.';
    } finally {
      this.isSaving = false;
    }
  }

  async deleteGalleryItem(item: CommunityGalleryRow): Promise<void> {
    if (!window.confirm(`Delete "${item.title}" from the gallery?`)) return;
    this.error = '';
    this.notice = '';
    try {
      await this.content.deleteGalleryItem(item.id);
      this.notice = 'Gallery item deleted.';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to delete gallery item.';
    }
  }

  async setMemberApproval(member: CommunityMemberModerationRow, approved: boolean): Promise<void> {
    this.error = '';
    this.notice = '';
    try {
      await this.content.updateMember(member.id, { is_approved: approved });
      this.notice = approved ? 'Member profile approved. It remains private until the member chooses community visibility.' : 'Member profile hidden from public directories.';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to update member approval.';
    }
  }

  async setMemberSuspension(member: CommunityMemberModerationRow, suspended: boolean): Promise<void> {
    const action = suspended ? 'Suspend' : 'Restore';
    if (!window.confirm(`${action} this member account? Their existing profile stays private unless they previously chose community visibility.`)) return;
    this.error = '';
    this.notice = '';
    try {
      await this.content.updateMember(member.id, { is_suspended: suspended });
      this.notice = suspended ? 'Member account suspended.' : 'Member account restored.';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to update member account.';
    }
  }

  async deleteMember(member: CommunityMemberModerationRow): Promise<void> {
    if (!window.confirm(`Permanently delete the account and profile for "${member.display_name}"? Interests and profile data will also be deleted. This cannot be undone.`)) return;
    this.error = '';
    this.notice = '';
    try {
      await this.content.deleteMember(member.id);
      this.notice = 'Member account and profile permanently deleted.';
      await this.loadContent();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to delete member.';
    }
  }

  async changePage(key: SitePageKey): Promise<void> {
    this.pageKey = key;
    this.pageFields = this.pageOptions.find((option) => option.key === key)?.fields ?? [];
    await this.loadPage();
  }

  async savePage(): Promise<void> {
    this.isSaving = true;
    this.error = '';
    this.notice = '';
    try {
      await this.content.savePage(this.pageKey, this.pageDraft);
      this.notice = `${this.pageOptions.find((option) => option.key === this.pageKey)?.label ?? 'Page'} content updated.`;
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to save website copy.';
    } finally {
      this.isSaving = false;
    }
  }

  get filteredMembers(): CommunityMemberModerationRow[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.members.filter((member) =>
      !query || `${member.display_name} ${member.city} ${member.gotra}`.toLowerCase().includes(query)
    );
  }

  get filteredEvents(): CommunityEventRow[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.events.filter((event) =>
      !query || `${event.title} ${event.category} ${event.venue}`.toLowerCase().includes(query)
    );
  }

  get filteredAnnouncements(): CommunityAnnouncementRow[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.announcements.filter((item) =>
      !query || `${item.title} ${item.summary}`.toLowerCase().includes(query)
    );
  }

  get filteredGotras(): CommunityGotraRow[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.gotras.filter((gotra) =>
      !query || `${gotra.name} ${gotra.tradition} ${gotra.description}`.toLowerCase().includes(query)
    );
  }

  get filteredGalleryItems(): CommunityGalleryRow[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.galleryItems.filter((item) =>
      !query || `${item.title} ${item.category}`.toLowerCase().includes(query)
    );
  }

  cancelEdit(): void {
    this.editingEventId = '';
    this.editingAnnouncementId = '';
    this.editingGotraId = '';
    this.editingGalleryId = '';
    this.eventDraft = this.emptyEvent();
    this.announcementDraft = this.emptyAnnouncement();
    this.gotraDraft = this.emptyGotra();
    this.galleryDraft = this.emptyGalleryItem();
  }
  cancelEdit(): void {
    this.editingEventId = '';
    this.editingAnnouncementId = '';
    this.editingGotraId = '';
    this.editingGalleryId = '';
    this.eventDraft = this.emptyEvent();
    this.announcementDraft = this.emptyAnnouncement();
    this.gotraDraft = this.emptyGotra();
    this.galleryDraft = this.emptyGalleryItem();
  }

  getCurrentPageLabel(): string {
    return this.pageOptions.find(o => o.key === this.pageKey)?.label ?? '';
  }

  async signOut(): Promise<void> {
    this.error = '';
    try {
      await this.auth.signOut();
      window.location.assign('/admin/login');
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to sign out.';
    }
  }

  private emptyEvent(): {
    title: string;
    description: string;
    starts_at: string;
    venue: string;
    category: string;
    image_url: string;
    is_published: boolean;
  } {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return {
      title: '',
      description: '',
      starts_at: date.toISOString().slice(0, 16),
      venue: '',
      category: 'Community',
      image_url: '',
      is_published: false
    };
  }

  private emptyAnnouncement(): {
    title: string;
    summary: string;
    published_at: string;
    is_published: boolean;
  } {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return {
      title: '',
      summary: '',
      published_at: date.toISOString().slice(0, 16),
      is_published: false
    };
  }

  private toLocalDateTime(value: string): string {
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  private async loadPage(): Promise<void> {
    this.error = '';
    this.pageFields = this.pageOptions.find((option) => option.key === this.pageKey)?.fields ?? [];
    try {
      this.pageDraft = await this.content.getPage<Record<string, string>>(this.pageKey);
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to load website page content.';
    }
  }

  private emptyGotra(): Omit<CommunityGotraRow, 'id' | 'members'> {
    return { name: '', tradition: '', description: '', is_published: true, sort_order: 0 };
  }

  private emptyGalleryItem(): Omit<CommunityGalleryRow, 'id' | 'created_at'> {
    return { title: '', category: 'Community', image_url: '', shape: '', is_published: false };
  }
}
