import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerSkill, SkillTreeNode } from '../../../core/models/models';

@Component({
  selector: 'app-skill-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-tree.component.html',
  styleUrls: ['./skill-tree.component.scss'],
})
export class SkillTreeComponent implements OnChanges {
  @Input({ required: true }) skills: PlayerSkill[] = [];
  @Input() nodes: SkillTreeNode[] = [];

  segments = Array.from({ length: 10 });
  
  // Grouped trees for visualization
  trees: { root: SkillTreeNode, children: SkillTreeNode[] }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes'] && this.nodes) {
      this.buildTrees();
    }
  }

  private buildTrees(): void {
    this.trees = [];
    const roots = this.nodes.filter(n => !n.prerequisiteNodeKey);
    for (const r of roots) {
      const children = this.nodes.filter(n => n.parentSkillName === r.parentSkillName && n.nodeKey !== r.nodeKey);
      this.trees.push({ root: r, children });
    }
  }

  trackBySkill(_: number, s: PlayerSkill) { return s.id; }
}

