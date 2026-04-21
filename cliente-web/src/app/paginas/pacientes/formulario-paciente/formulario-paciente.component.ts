import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PacienteService } from '../../../servicios/paciente.service';
import { PacientePeticion } from '../../../modelos/paciente.model';
import { AutenticacionService } from '../../../servicios/autenticacion.service';

/** Formulario de alta y edicion de pacientes. */
@Component({
  selector: 'app-formulario-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './formulario-paciente.component.html',
  styleUrls: ['./formulario-paciente.component.css']
})
export class FormularioPacienteComponent implements OnInit {
  private readonly pacienteService = inject(PacienteService);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  paciente: PacientePeticion = {
    nombreDelPaciente: '',
    apellidoDelPaciente: '',
    tipoDocumentoIdentidad: 'DNI',
    numeroDocumentoIdentidad: '',
    fechaDeNacimiento: '',
    sexoBiologico: 'Masculino',
    telefonoDeContacto: '',
    correoElectronico: '',
    direccionDomiciliaria: ''
  };

  idEditando: number | null = null;
  guardando = false;
  error: string | null = null;

  ngOnInit(): void {
    const idParam = this.ruta.snapshot.paramMap.get('id');
    if (idParam) {
      this.idEditando = Number(idParam);
      this.pacienteService.obtenerPorId(this.idEditando).subscribe({
        next: (data) => {
          this.paciente = {
            nombreDelPaciente: data.nombreDelPaciente,
            apellidoDelPaciente: data.apellidoDelPaciente,
            numeroDocumentoIdentidad: data.numeroDocumentoIdentidad,
            tipoDocumentoIdentidad: data.tipoDocumentoIdentidad,
            fechaDeNacimiento: data.fechaDeNacimiento,
            sexoBiologico: data.sexoBiologico,
            telefonoDeContacto: data.telefonoDeContacto ?? '',
            correoElectronico: data.correoElectronico ?? '',
            direccionDomiciliaria: data.direccionDomiciliaria ?? '',
            idClinica: data.idClinica
          };
        },
        error: () => (this.error = 'No se pudo cargar el paciente.')
      });
    } else {
      const usuario = this.autenticacion.obtenerUsuario();
      if (usuario?.idClinica != null) {
        this.paciente.idClinica = usuario.idClinica;
      }
    }
  }

  guardar(): void {
    this.guardando = true;
    this.error = null;

    const observable$ =
      this.idEditando !== null
        ? this.pacienteService.actualizar(this.idEditando, this.paciente)
        : this.pacienteService.crear(this.paciente);

    observable$.subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/pacientes']);
      },
      error: () => {
        this.guardando = false;
        this.error = 'No se pudo guardar el paciente.';
      }
    });
  }
}
