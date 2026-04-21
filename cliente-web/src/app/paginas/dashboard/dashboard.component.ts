import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionService } from '../../servicios/autenticacion.service';
import { Usuario } from '../../modelos/usuario.model';

/** Panel principal con accesos a los modulos. */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);

  usuario: Usuario | null = this.autenticacion.obtenerUsuario();

  cerrarSesion(): void {
    this.autenticacion.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
