import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  officerId = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onLogin(): void {
    this.error = '';
    this.loading = true;
    this.cdr.markForCheck();

    this.auth.login(this.officerId, this.password).subscribe((officer) => {
      this.loading = false;
      if (officer) {
        this.router.navigate(['/']);
      } else {
        this.error = 'Invalid Officer ID or password.';
      }
      this.cdr.markForCheck();
    });
  }
}
