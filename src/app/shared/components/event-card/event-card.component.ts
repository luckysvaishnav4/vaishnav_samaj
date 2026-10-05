import { Component, Input } from '@angular/core';
import { CommunityEvent } from '../../../core/models/community.models';

@Component({
  selector: 'app-event-card',
  standalone: true,
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css'
})
export class EventCardComponent {
  @Input({ required: true }) event!: CommunityEvent;
}
