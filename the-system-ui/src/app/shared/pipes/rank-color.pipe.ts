import { Pipe, PipeTransform } from '@angular/core';
import { rankStyle } from '../system.constants';

@Pipe({ name: 'rankColor', standalone: true })
export class RankColorPipe implements PipeTransform {
  transform(rank: string, part: 'color' | 'bg' | 'border' = 'color'): string {
    return rankStyle(rank)[part];
  }
}

