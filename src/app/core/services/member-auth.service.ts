import { Injectable } from '@angular/core';
import { CommunityApiService } from './community-api.service';

export interface MemberSignupProfile {
  display_name: string;
  gender: 'Man' | 'Woman' | 'Prefer not to say';
  date_of_birth: string;
  gotra: string;
  city: string;
  education: string;
  profession: string;
  about: string;
  family_information: string;
  phone: string;
}

interface AuthResponse {
  token: string;
  user: { id: string; email: string; isAdmin: boolean };
}

export interface SignedInUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class MemberAuthService {
  constructor(private readonly api: CommunityApiService) {}

  async signUp(email: string, password: string, profile: MemberSignupProfile): Promise<boolean> {
    const result = await this.api.post<AuthResponse>('/auth/register', { email: email.trim(), password, profile });
    this.api.setSessionToken(result.token);
    return true;
  }

  async signIn(email: string, password: string): Promise<void> {
    const result = await this.api.post<AuthResponse>('/auth/login', { email: email.trim(), password });
    this.api.setSessionToken(result.token);
  }

  async currentUser(): Promise<SignedInUser | null> {
    if (!this.api.hasSessionToken) return null;
    try {
      return await this.api.get<SignedInUser>('/auth/me');
    } catch (error: unknown) {
      if (error instanceof Error && /session|sign in|active/i.test(error.message)) {
        this.api.clearSessionToken();
        return null;
      }
      throw error;
    }
  }

  async currentUserId(): Promise<string | null> {
    return (await this.currentUser())?.id ?? null;
  }

  async currentUserEmail(): Promise<string | null> {
    return (await this.currentUser())?.email ?? null;
  }

  async signOut(): Promise<void> {
    this.api.clearSessionToken();
  }
}
