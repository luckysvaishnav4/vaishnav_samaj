import { Injectable } from '@angular/core';
import { MemberAuthService } from './member-auth.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  constructor(private readonly memberAuth: MemberAuthService) {}

  async signIn(email: string, password: string): Promise<void> {
    await this.memberAuth.signIn(email, password);
    if (!(await this.isCurrentUserAdmin())) {
      await this.memberAuth.signOut();
      throw new Error('This account is not approved for community administration.');
    }
  }

  async isCurrentUserAdmin(): Promise<boolean> {
    return (await this.memberAuth.currentUser())?.isAdmin ?? false;
  }

  async signOut(): Promise<void> {
    await this.memberAuth.signOut();
  }
}
