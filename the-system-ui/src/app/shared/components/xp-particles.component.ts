import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-xp-particles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xp-particles.component.html',
  styleUrls: ['./xp-particles.component.scss']
})
export class XpParticlesComponent {
  public uiState = inject(UiStateService);
}
