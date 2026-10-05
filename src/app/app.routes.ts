import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { GotrasComponent } from './pages/gotras/gotras.component';
import { MembersComponent } from './pages/members/members.component';
import { MatchesComponent } from './pages/matches/matches.component';
import { ProfileDetailsComponent } from './pages/profile-details/profile-details.component';
import { RegisterProfileComponent } from './pages/register-profile/register-profile.component';
import { EventsComponent } from './pages/events/events.component';
import { AnnouncementsComponent } from './pages/announcements/announcements.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { ContactComponent } from './pages/contact/contact.component';
import { adminGuard } from './core/services/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Vaishnav Samaj | A home for our community' },
  { path: 'about', component: AboutComponent, title: 'About Vaishnav Samaj' },
  { path: 'gotras', component: GotrasComponent, title: 'Gotra directory | Vaishnav Samaj' },
  { path: 'members', component: MembersComponent, title: 'Community members | Vaishnav Samaj' },
  { path: 'matches', component: MatchesComponent, title: 'Thoughtful connections | Vaishnav Samaj' },
  { path: 'profile/:id', component: ProfileDetailsComponent, title: 'Member profile | Vaishnav Samaj' },
  { path: 'register', component: RegisterProfileComponent, title: 'Create a profile | Vaishnav Samaj' },
  { path: 'member-login', loadComponent: () => import('./pages/member-login/member-login.component').then(module => module.MemberLoginComponent), title: 'Member sign in | Vaishnav Samaj' },
  { path: 'my-profile', loadComponent: () => import('./pages/my-profile/my-profile.component').then(module => module.MyProfileComponent), title: 'My profile | Vaishnav Samaj' },
  { path: 'events', component: EventsComponent, title: 'Community events | Vaishnav Samaj' },
  { path: 'announcements', component: AnnouncementsComponent, title: 'Samaj announcements | Vaishnav Samaj' },
  { path: 'gallery', component: GalleryComponent, title: 'Community gallery | Vaishnav Samaj' },
  { path: 'contact', component: ContactComponent, title: 'Contact Vaishnav Samaj' },
  { path: 'admin/login', loadComponent: () => import('./pages/admin-login/admin-login.component').then(module => module.AdminLoginComponent), title: 'Admin sign in | Vaishnav Samaj' },
  { path: 'admin', loadComponent: () => import('./pages/admin/admin.component').then(module => module.AdminComponent), canActivate: [adminGuard], title: 'Community admin | Vaishnav Samaj' },
  { path: '**', redirectTo: '' }
];
