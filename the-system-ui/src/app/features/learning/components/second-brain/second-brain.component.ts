import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BrainNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lastEdited: string;
}

@Component({
  selector: 'app-second-brain',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="second-brain glass-panel">
      <!-- Sidebar -->
      <div class="sb-sidebar">
        <div class="sb-header">
          <h3 class="mono tech" style="color: #6C63FF; margin-bottom: 12px; letter-spacing: 1px;">? SECOND BRAIN</h3>
          <button class="sys-btn-secondary full-width" (click)="createNewNote()">+ NEW PAGE</button>
        </div>
        <div class="sb-search">
          <input type="text" class="premium-input" placeholder="Search knowledge..." [(ngModel)]="searchQuery" style="width: 100%; padding: 8px;" />
        </div>
        <div class="sb-note-list">
          <div class="sb-note-item" 
               *ngFor="let n of filteredNotes()" 
               [class.active]="selectedNote()?.id === n.id"
               (click)="selectNote(n)">
            <span class="note-icon">??</span>
            <div class="note-info">
              <div class="note-title">{{ n.title || 'Untitled' }}</div>
              <div class="note-date tech">{{ n.lastEdited | date:'MMM d, yyyy' }}</div>
            </div>
          </div>
          <div class="empty-state tech" *ngIf="filteredNotes().length === 0" style="padding: 20px; text-align: center; color: #8a8a9a;">
            No pages found.
          </div>
        </div>
      </div>

      <!-- Editor -->
      <div class="sb-editor" *ngIf="selectedNote()">
        <div class="editor-header">
          <input type="text" class="title-input mono" placeholder="Untitled Page" [(ngModel)]="selectedNote()!.title" (input)="saveToLocal()" />
          <div class="tags-row">
            <span class="tag tech" *ngFor="let t of selectedNote()!.tags">{{ t }}</span>
            <button class="sys-btn-secondary sm" style="padding: 2px 8px; font-size: 0.7rem;" (click)="addTag()">+ TAG</button>
          </div>
        </div>
        <textarea class="content-input" placeholder="Start typing... (Markdown supported mentally)" [(ngModel)]="selectedNote()!.content" (input)="saveToLocal()"></textarea>
      </div>

      <div class="sb-editor-empty" *ngIf="!selectedNote()">
        <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;">??</div>
        <div class="tech" style="color: #a0aabf; font-size: 1.1rem;">Select or create a page to expand your knowledge base.</div>
      </div>
    </div>
  `,
  styles: [`
    .second-brain {
      display: flex;
      height: 600px;
      border-color: rgba(108, 99, 255, 0.4);
      padding: 0;
      overflow: hidden;
      background: rgba(10, 10, 20, 0.6);
    }
    .sb-sidebar {
      width: 280px;
      border-right: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      background: rgba(0,0,0,0.2);
    }
    .sb-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .sb-search { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .sb-note-list { flex: 1; overflow-y: auto; }
    .sb-note-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.02);
      transition: background 0.2s;
    }
    .sb-note-item:hover { background: rgba(108, 99, 255, 0.1); }
    .sb-note-item.active { background: rgba(108, 99, 255, 0.2); border-left: 3px solid #6C63FF; padding-left: 17px; }
    .note-icon { font-size: 1.2rem; opacity: 0.8; }
    .note-info { flex: 1; overflow: hidden; }
    .note-title { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
    .note-date { font-size: 0.75rem; color: #8a8a9a; margin-top: 4px; }
    
    .sb-editor { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.1); }
    .editor-header { padding: 30px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .title-input {
      width: 100%;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 2rem;
      font-weight: 700;
      outline: none;
      margin-bottom: 16px;
    }
    .tags-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .tag { background: rgba(108, 99, 255, 0.2); color: #b3aef0; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; border: 1px solid rgba(108, 99, 255, 0.4); }
    .content-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #d1d5db;
      padding: 20px 40px;
      font-size: 1rem;
      line-height: 1.7;
      resize: none;
      outline: none;
      font-family: 'Inter', sans-serif;
    }
    .sb-editor-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  `]
})
export class SecondBrainComponent implements OnInit {
  notes = signal<BrainNote[]>([]);
  selectedNote = signal<BrainNote | null>(null);
  searchQuery = signal<string>('');

  filteredNotes = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.notes();
    return this.notes().filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.content.toLowerCase().includes(q) || 
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  ngOnInit() {
    const stored = localStorage.getItem('system_second_brain');
    if (stored) {
      this.notes.set(JSON.parse(stored));
    } else {
      // Seed data
      this.notes.set([
        {
          id: '1',
          title: 'System Architecture',
          content: '# The System Architecture\n\n1. **Core Stats**: STR, AGI, INT, VIT\n2. **State Manager**: Angular Signals\n\nMust ensure UI feels premium.',
          tags: ['tech', 'design'],
          lastEdited: new Date().toISOString()
        }
      ]);
    }
  }

  createNewNote() {
    const newNote: BrainNote = {
      id: Math.random().toString(36).substring(2, 9),
      title: '',
      content: '',
      tags: [],
      lastEdited: new Date().toISOString()
    };
    this.notes.update(n => [newNote, ...n]);
    this.selectedNote.set(newNote);
    this.saveToLocal();
  }

  selectNote(n: BrainNote) {
    this.selectedNote.set(n);
  }

  addTag() {
    if (!this.selectedNote()) return;
    const t = prompt('Enter new tag:');
    if (t) {
      this.selectedNote()!.tags.push(t);
      this.saveToLocal();
    }
  }

  saveToLocal() {
    if (this.selectedNote()) {
      this.selectedNote()!.lastEdited = new Date().toISOString();
    }
    localStorage.setItem('system_second_brain', JSON.stringify(this.notes()));
  }
}
