import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SuspectService } from '../../core/services/suspect.service';
import { Officer } from '../../models/officer.model';
import { Suspect } from '../../models/suspect.model';

@Component({
  selector: 'app-case-share',
  standalone: true,
  imports: [FormsModule, UpperCasePipe],
  templateUrl: './case-share.component.html',
  styleUrl: './case-share.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseShareComponent implements OnInit {
  @Input() suspectId!: string;
  @Output() close = new EventEmitter<void>();

  officers: Officer[] = [];
  suspect: Suspect | null = null;
  selectedOfficerId = '';
  notes = '';
  shared = false;

  constructor(
    private readonly auth: AuthService,
    private readonly suspectService: SuspectService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.suspect = this.suspectService.getSuspectById(this.suspectId) ?? null;

    const currentId = this.auth.currentOfficer?.id;
    this.auth.getOfficers().subscribe((all) => {
      this.officers = all.filter((o) => o.id !== currentId);
      this.cdr.markForCheck();
    });
  }

  onShare(): void {
    if (!this.selectedOfficerId) return;
    this.auth.shareCase(this.suspectId, this.selectedOfficerId, this.notes.trim() || undefined);
    this.shared = true;
    this.cdr.markForCheck();
  }

  getInitials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }
}
