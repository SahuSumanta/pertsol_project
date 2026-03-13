import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InvestigationNote } from '../../models/note.model';
import { NotesService } from '../../core/services/notes.service';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';

@Component({
  selector: 'app-notes-panel',
  standalone: true,
  imports: [AsyncPipe, DatePipe, GlassCardComponent],
  templateUrl: './notes-panel.component.html',
  styleUrl: './notes-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesPanelComponent implements OnChanges {
  @Input() selectedSuspectId: string | null = null;

  notes$?: Observable<InvestigationNote[]>;

  constructor(private readonly notesService: NotesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedSuspectId' in changes) {
      this.loadNotes();
    }
  }

  private loadNotes(): void {
    if (!this.selectedSuspectId) {
      this.notes$ = undefined;
      return;
    }

    this.notes$ = this.notesService.getNotes().pipe(
      map((all) =>
        all
          .filter((n) => n.suspectId === this.selectedSuspectId)
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          ),
      ),
    );
  }
}

