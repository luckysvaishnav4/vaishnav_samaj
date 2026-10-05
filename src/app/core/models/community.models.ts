export interface CommunityProfile {
  id: string;
  name: string;
  gender: 'Man' | 'Woman' | 'Prefer not to say';
  age: number;
  city: string;
  gotra: string;
  education: string;
  profession: string;
  introduction: string;
  image: string;
  verified: boolean;
  active: boolean;
  family: string;
  lifestyle: string;
  isDemo?: boolean;
  visibility?: 'private' | 'community';
}

export interface Gotra {
  name: string;
  description: string;
  tradition: string;
  members: number;
  isDemo?: boolean;
}

export interface CommunityEvent {
  title: string;
  date: string;
  venue: string;
  category: string;
  description: string;
  image: string;
}

export interface Announcement {
  title: string;
  date: string;
  category: string;
  summary: string;
}
