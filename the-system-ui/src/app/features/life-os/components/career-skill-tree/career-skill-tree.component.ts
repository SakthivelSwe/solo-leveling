import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SkillNode {
  id: string;
  label: string;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  children: SkillNode[];
}

@Component({
  selector: 'app-career-skill-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './career-skill-tree.component.html',
  styleUrls: ['./career-skill-tree.component.scss']
})
export class CareerSkillTreeComponent {
  @Input() rootNodes: SkillNode[] = [];
}
