import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerSkill } from '../../../core/models/models';

@Component({
  selector: 'app-skill-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-tree.component.html',
  styleUrls: ['./skill-tree.component.scss'],
})
export class SkillTreeComponent {
  @Input({ required: true }) skills: PlayerSkill[] = [];

  segments = Array.from({ length: 10 });

  trackBySkill(_: number, s: PlayerSkill) { return s.id; }
}

