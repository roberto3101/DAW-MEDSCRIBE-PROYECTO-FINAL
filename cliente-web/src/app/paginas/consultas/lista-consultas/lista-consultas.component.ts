import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsultaService } from '../../../servicios/consulta.service';
import { Consulta } from '../../../modelos/consulta.model';

/** Lista de consultas con acciones basicas. */
@Component({
  selector: 'app-lista-consultas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lista-consultas.component.html',
  styleUrls: ['./lista-consultas.component.css']
})
export class ListaConsultasComponent implements OnInit {
  private readonly consultaService = inject(ConsultaService);

  consultas: Consulta[] = [];
  cargando = false;
  error: string | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = null;
    this.consultaService.listarTodas().subscribe({
      next: (data) => {
        this.consultas = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo obtener la lista de consultas.';
        this.cargando = false;
      }
    });
  }

  eliminar(consulta: Consulta): void {
    if (consulta.idConsulta === undefined) return;
    if (!confirm(`Eliminar la consulta #${consulta.idConsulta}?`)) return;

    this.consultaService.eliminar(consulta.idConsulta).subscribe({
      next: () => this.cargar(),
      error: () => alert('No se pudo eliminar la consulta.')
    });
  }
}
