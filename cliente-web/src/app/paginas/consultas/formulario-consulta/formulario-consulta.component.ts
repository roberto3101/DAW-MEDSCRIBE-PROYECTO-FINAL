import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConsultaService } from '../../../servicios/consulta.service';
import { RegistrarConsultaPeticion } from '../../../modelos/consulta.model';
import { AutenticacionService } from '../../../servicios/autenticacion.service';

/** Formulario para crear una nueva consulta. */
@Component({
  selector: 'app-formulario-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './formulario-consulta.component.html',
  styleUrls: ['./formulario-consulta.component.css']
})
export class FormularioConsultaComponent implements OnInit {
  private readonly consultaService = inject(ConsultaService);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);

  consulta: RegistrarConsultaPeticion = {
    idMedicoResponsable: 0,
    idPacienteAtendido: 0,
    especialidad: '',
    tipoDocumento: 'SOAP',
    transcripcion: '',
    notaClinica: ''
  };

  guardando = false;
  error: string | null = null;

  ngOnInit(): void {
    const usuario = this.autenticacion.obtenerUsuario();
    if (usuario) {
      this.consulta.idMedicoResponsable = usuario.idUsuario;
      if (usuario.idClinica != null) {
        this.consulta.idClinica = usuario.idClinica;
      }
    }
  }

  guardar(): void {
    this.guardando = true;
    this.error = null;
    this.consultaService.crear(this.consulta).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/consultas']);
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo guardar la consulta.';
      }
    });
  }
}
