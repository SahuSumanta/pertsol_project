import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SuspectService } from '../../core/services/suspect.service';

@Component({
  selector: 'app-add-suspect',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-suspect.component.html',
  styleUrl: './add-suspect.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSuspectComponent {
  @Output() close = new EventEmitter<void>();

  name = '';
  riskLevel: 'low' | 'medium' | 'high' = 'low';
  lastKnownLocation = '';
  phone = '';
  notes = '';

  constructor(private readonly suspectService: SuspectService) {}

  onSave(): void {
    if (!this.name.trim()) return;

    this.suspectService.addSuspect({
      displayName: this.name.trim(),
      riskLevel: this.riskLevel,
      riskScore: this.riskLevel === 'high' ? 80 : this.riskLevel === 'medium' ? 50 : 25,
      lastKnownLocation: this.lastKnownLocation.trim() || undefined,
      phone: this.phone.trim() || undefined,
      notes: this.notes.trim() || undefined,
      surveillanceStatus: 'active',
      activityLevel: 'low',
      signalStrength: 'moderate',
    });

    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }
}
