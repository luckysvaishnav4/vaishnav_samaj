import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Gotra } from '../../../core/models/community.models';

@Component({
  selector: 'app-gotra-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './gotra-card.component.html',
  styleUrl: './gotra-card.component.css'
})
export class GotraCardComponent {
  @Input({ required: true }) gotra!: Gotra;
}
