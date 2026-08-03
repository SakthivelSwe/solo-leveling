import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AiCommanderBriefingDTO } from '../../../core/models/models';

@Component({
  selector: 'app-daily-briefing-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './daily-briefing-modal.component.html',
  styleUrls: ['./daily-briefing-modal.component.scss']
})
export class DailyBriefingModalComponent implements OnInit {
  briefing = signal<AiCommanderBriefingDTO | null>(null);
  
  constructor(
    public dialogRef: MatDialogRef<DailyBriefingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { briefing: AiCommanderBriefingDTO }
  ) {}

  ngOnInit(): void {
    this.briefing.set(this.data.briefing);
  }

  acknowledge(): void {
    this.dialogRef.close(true);
  }
}
