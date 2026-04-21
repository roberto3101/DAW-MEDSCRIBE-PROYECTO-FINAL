import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticacionService } from '../../servicios/autenticacion.service';

/** Pantalla de inicio de sesion contra el gateway .NET. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);

  correo = '';
  contrasena = '';
  cargando = false;
  mensajeError: string | null = null;
  mostrarContrasena = false;

  alternarMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  alEnviar(): void {
    if (!this.correo || !this.contrasena) {
      this.mensajeError = 'Ingrese correo y contrasena.';
      return;
    }
    this.cargando = true;
    this.mensajeError = null;

    this.autenticacion.iniciarSesion(this.correo, this.contrasena).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError =
          err?.error?.mensaje ||
          'Credenciales invalidas o no se pudo contactar al servidor.';
      }
    });
  }
}
