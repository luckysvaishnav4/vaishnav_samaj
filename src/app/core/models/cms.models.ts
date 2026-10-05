export interface CommunityGotraRow {
  id: string;
  name: string;
  tradition: string;
  description: string;
  is_published: boolean;
  sort_order: number;
  members?: number;
}

export interface CommunityGalleryRow {
  id: string;
  title: string;
  category: string;
  image_url: string;
  shape: '' | 'wide' | 'tall';
  is_published: boolean;
  created_at: string;
}

export interface CommunityMemberModerationRow {
  id: string;
  display_name: string;
  gender: 'Man' | 'Woman' | 'Prefer not to say';
  age: number;
  gotra: string;
  city: string;
  visibility: 'private' | 'community';
  is_approved: boolean;
  is_suspended: boolean;
  updated_at: string;
}

export interface AdminOverview {
  members: number;
  pending_profiles: number;
  events: number;
  announcements: number;
  gotras: number;
  gallery_items: number;
}

export interface HomePageContent {
  kicker: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
}

export interface AboutPageContent {
  bannerKicker: string;
  bannerTitle: string;
  bannerDescription: string;
  introTitle: string;
  introParagraph1: string;
  introParagraph2: string;
  quote: string;
}

export interface ContactPageContent {
  city: string;
  phone: string;
  phoneNote: string;
  whatsapp: string;
  whatsappNote: string;
  email: string;
  emailNote: string;
  address: string;
  mapUrl: string;
}

export interface GalleryItem {
  id?: string;
  title: string;
  category: string;
  image: string;
  shape: '' | 'wide' | 'tall';
}
