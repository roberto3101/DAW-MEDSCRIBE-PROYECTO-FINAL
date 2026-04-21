import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PacienteService } from '../../../servicios/paciente.service';
import { Paciente } from '../../../modelos/paciente.model';

/** Lista con acciones CRUD para pacientes. */
@Component({
  selector: 'app-lista-pacientes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lista-pacientes.component.html',
  styleUrls: ['./lista-pacientes.component.css']
})
export class ListaPacientesComponent implements OnInit {
  private readonly pacienteService = inject(PacienteService);
  private readonly router = inject(Router);

  pacientes: Paciente[] = [];
  cargando = false;
  error: string | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = null;
    this.pacienteService.listarTodos().subscribe({
      next: (data) => {
        this.pacientes = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo obtener la lista de pacientes.';
        this.cargando = false;
      }
    });
  }

  editar(id: number | undefined): void {
    if (id !== undefined) {
      this.router.navigate(['/pacientes/editar', id]);
    }
  }

  eliminar(paciente: Paciente): void {
    if (paciente.idPaciente === undefined) return;
    const confirmado = confirm(
      `Eliminar al paciente ${paciente.nombreDelPaciente} ${paciente.apellidoDelPaciente}?`
    );
    if (!confirmado) return;

    this.pacienteService.eliminar(paciente.idPaciente).subscribe({
      next: () => this.cargar(),
      error: () => alert('No se pudo eliminar el paciente.')
    });
  }
}
