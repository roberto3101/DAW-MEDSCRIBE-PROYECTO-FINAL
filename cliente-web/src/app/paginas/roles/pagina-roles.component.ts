import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Shield, Plus, Pencil, Save, Power } from 'lucide-angular';
import { CargandoComponent } from '../../componentes/comunes/cargando.component';
import { ModalComponent } from '../../componentes/comunes/modal.component';
import { Rol } from '../../modelos/rol.model';
import { AutenticacionService } from '../../servicios/autenticacion.service';
import { RolService } from '../../servicios/rol.service';
import { ACCIONES_DISPONIBLES, MODULOS_DISPONIBLES } from '../../utilidades/constantes';

@Component({
  selector: 'app-pagina-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CargandoComponent, ModalComponent],
  template: `
    <app-cargando *ngIf="estaCargando()"></app-cargando>

    <div *ngIf="!estaCargando()" class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <lucide-icon [img]="iconoShield" class="w-7 h-7 text-medico-500"></lucide-icon>
            Roles y Permisos
          </h1>
          <p class="text-slate-400 mt-1">{{ roles().length }} roles configurados</p>
        </div>
        <button (click)="abrirModalCrear()"
          class="flex items-center gap-2 bg-medico-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
          <lucide-icon [img]="iconoPlus" class="w-4 h-4"></lucide-icon> Nuevo Rol
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let r of roles()"
          class="bg-white rounded-xl border p-5"
          [ngClass]="r.estaActivo === false ? 'border-slate-200 opacity-60' : 'border-slate-200'">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-sm font-semibold text-slate-800">{{ r.nombreDelRol }}</h3>
              <p class="text-xs text-slate-400 mt-0.5">{{ r.descripcionDelRol }}</p>
            </div>
            <div class="flex gap-1">
              <span *ngIf="r.esRolBase" class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Base</span>
              <span *ngIf="r.estaActivo === false" class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inactivo</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 mb-3">{{ contarPermisos(r.permisosEnFormatoJSON) }} permisos activos</p>
          <div class="flex flex-wrap gap-1 mb-3">
            <span *ngFor="let modulo of modulos" class="text-[10px] px-1.5 py-0.5 rounded"
              [ngClass]="moduloTieneAcceso(r.permisosEnFormatoJSON, modulo) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'">
              {{ modulo }}
            </span>
          </div>
          <div class="flex gap-2">
            <button (click)="abrirModalEditar(r)"
              class="flex-1 flex items-center justify-center gap-1 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-medico-50 hover:text-medico-600 transition-colors">
              <lucide-icon [img]="iconoEdit" class="w-3 h-3"></lucide-icon> Editar
            </button>
            <button *ngIf="!r.esRolBase" (click)="toggleEstadoRol(r)"
              class="flex items-center justify-center gap-1 py-2 px-3 border rounded-lg text-xs transition-colors"
              [ngClass]="r.estaActivo === false ? 'border-emerald-200 text-emerald-500 hover:bg-emerald-50' : 'border-red-200 text-red-400 hover:bg-red-50'">
              <lucide-icon [img]="iconoPower" class="w-3 h-3"></lucide-icon>
            </button>
          </div>
        </div>
      </div>

      <app-modal [estaAbierto]="modalAbierto()" (alCerrar)="modalAbierto.set(false)"
        [titulo]="rolEnEdicion() ? 'Editar Rol' : 'Nuevo Rol'">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Nombre del Rol</label>
            <input type="text" [(ngModel)]="nombre" maxlength="50"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Descripcion</label>
            <input type="text" [(ngModel)]="descripcion" maxlength="200"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20" />
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-medium text-slate-500">Permisos por Modulo</label>
              <div class="flex gap-2">
                <button type="button" (click)="darTodosLosPermisos()"
                  class="text-[10px] font-medium px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                  Dar todos los permisos
                </button>
                <button type="button" (click)="quitarTodosLosPermisos()"
                  class="text-[10px] font-medium px-3 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                  Quitar todos
                </button>
              </div>
            </div>
            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="bg-slate-50">
                    <th class="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase">Modulo</th>
                    <th *ngFor="let a of acciones" class="text-center px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase">{{ a }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let m of modulos">
                    <td class="px-3 py-2 text-sm text-slate-700 capitalize">{{ m }}</td>
                    <td *ngFor="let a of acciones" class="text-center px-2 py-2">
                      <input type="checkbox" [checked]="permisos[m]?.[a] || false"
                        (change)="togglePermiso(m, a)"
                        class="w-4 h-4 rounded border-slate-300 text-medico-500 focus:ring-medico-500/20" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <button (click)="guardarRol()"
            class="w-full flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
            <lucide-icon [img]="iconoSave" class="w-4 h-4"></lucide-icon>
            {{ rolEnEdicion() ? 'Actualizar Rol' : 'Crear Rol' }}
          </button>
        </div>
      </app-modal>
    </div>
  `
})
export class PaginaRolesComponent {
  private readonly rolService = inject(RolService);
  private readonly autenticacion = inject(AutenticacionService);

  iconoShield = Shield;
  iconoPlus = Plus;
  iconoEdit = Pencil;
  iconoSave = Save;
  iconoPower = Power;

  modulos = [...MODULOS_DISPONIBLES];
  acciones = [...ACCIONES_DISPONIBLES];

  roles = signal<Rol[]>([]);
  estaCargando = signal(true);
  modalAbierto = signal(false);
  rolEnEdicion = signal<Rol | null>(null);
  nombre = '';
  descripcion = '';
  permisos: Record<string, Record<string, boolean>> = {};

  constructor() {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.rolService.listarRoles().subscribe({
      next: (datos) => {
        this.roles.set(datos);
        this.estaCargando.set(false);
      },
      error: () => this.estaCargando.set(false)
    });
  }

  contarPermisos(permisosJson: string): number {
    try {
      const p = JSON.parse(permisosJson);
      return Object.values(p).reduce((acc: number, m: any) => acc + Object.values(m).filter(Boolean).length, 0);
    } catch { return 0; }
  }

  moduloTieneAcceso(permisosJson: string, modulo: string): boolean {
    try {
      const p = JSON.parse(permisosJson);
      return !!p[modulo]?.ver;
    } catch { return false; }
  }

  abrirModalCrear(): void {
    this.rolEnEdicion.set(null);
    this.nombre = '';
    this.descripcion = '';
    const base: Record<string, Record<string, boolean>> = {};
    this.modulos.forEach(m => { base[m] = { ver: false, crear: false, editar: false, eliminar: false }; });
    this.permisos = base;
    this.modalAbierto.set(true);
  }

  abrirModalEditar(rol: Rol): void {
    this.rolEnEdicion.set(rol);
    this.nombre = rol.nombreDelRol;
    this.descripcion = rol.descripcionDelRol || '';
    try { this.permisos = JSON.parse(rol.permisosEnFormatoJSON); } catch { this.permisos = {}; }
    this.modalAbierto.set(true);
  }

  togglePermiso(modulo: string, accion: string): void {
    if (!this.permisos[modulo]) this.permisos[modulo] = { ver: false, crear: false, editar: false, eliminar: false };
    const nuevoValor = !this.permisos[modulo][accion];

    if (accion === 'ver' && !nuevoValor) {
      this.permisos[modulo] = { ver: false, crear: false, editar: false, eliminar: false };
    } else {
      this.permisos[modulo][accion] = nuevoValor;
      if (nuevoValor && accion !== 'ver') this.permisos[modulo]['ver'] = true;
    }
  }

  darTodosLosPermisos(): void {
    const todos: Record<string, Record<string, boolean>> = {};
    this.modulos.forEach(m => { todos[m] = { ver: true, crear: true, editar: true, eliminar: true }; });
    this.permisos = todos;
  }

  quitarTodosLosPermisos(): void {
    const ninguno: Record<string, Record<string, boolean>> = {};
    this.modulos.forEach(m => { ninguno[m] = { ver: false, crear: false, editar: false, eliminar: false }; });
    this.permisos = ninguno;
  }

  guardarRol(): void {
    const rolExistente = this.rolEnEdicion();
    const peticion = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      permisosJson: JSON.stringify(this.permisos),
    };
    const onSuccess = () => { this.modalAbierto.set(false); this.cargarRoles(); };
    if (rolExistente) {
      this.rolService.actualizarRol(rolExistente.idRol, peticion).subscribe({ next: onSuccess });
    } else {
      this.rolService.crearRol(peticion).subscribe({ next: onSuccess });
    }
  }

  toggleEstadoRol(rol: Rol): void {
    const accion = rol.estaActivo === false ? 'reactivar' : 'desactivar';
    if (!confirm(`${accion[0].toUpperCase() + accion.slice(1)} este rol?`)) return;
    this.rolService.cambiarEstadoRol(rol.idRol, rol.estaActivo === false).subscribe({
      next: () => this.cargarRoles()
    });
  }
}
