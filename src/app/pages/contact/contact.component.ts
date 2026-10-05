import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactPageContent } from '../../core/models/cms.models';
import { CommunityApiService } from '../../core/services/community-api.service';
import { CommunityBackendService } from '../../core/services/community-backend.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  sent = false;
  pageContent: ContactPageContent = {
    city: 'Ahmedabad, Gujarat, India',
    phone: 'Office number to be confirmed',
    phoneNote: 'Replace with verified Samaj office number',
    whatsapp: 'Office contact to be confirmed',
    whatsappNote: 'No active Samaj WhatsApp account is configured',
    email: 'Office email to be confirmed',
    emailNote: 'Replace with a verified Samaj office address',
    address: 'Ahmedabad, Gujarat, India',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Ahmedabad%2C%20Gujarat'
  };
  loadError = '';

  constructor(private readonly api: CommunityApiService, private readonly backend: CommunityBackendService) {
    if (this.api.isConfigured) void this.loadPageContent();
  }

  private async loadPageContent(): Promise<void> {
    try {
      this.pageContent = await this.backend.getPageContent<ContactPageContent>('contact');
    } catch (error: unknown) {
      this.loadError = error instanceof Error ? error.message : 'Unable to load contact page information.';
    }
  }

  submitMessage(): void {
    this.sent = true;
  }
}
