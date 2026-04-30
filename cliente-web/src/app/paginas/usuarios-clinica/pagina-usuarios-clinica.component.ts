import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Users,
  Plus,
  Shield,
  UserCheck,
  Lock,
  Check,
  X,
  Minus,
  AlertCircle
} from 'lucide-angular';
import { CargandoComponent } from '../../componentes/comunes/cargando.component';
import { ModalComponent } from '../../componentes/comunes/modal.component';
import { Rol, UsuarioDeClinica, PermisosUsuarioRespuesta } from '../../modelos/rol.model';
import { AutenticacionService } from '../../servicios/autenticacion.service';
import { RolService } from '../../servicios/rol.service';
import { UsuarioClinicaService } from '../../servicios/usuario-clinica.service';
import { ACCIONES_DISPONIBLES, MODULOS_DISPONIBLES } from '../../utilidades/constantes';
import { sanitizarNombre, validarCorreo, validarContrasena, validarNombre } from '../../utilidades/validaciones';

@Component({
  selector: 'app-pagina-usuarios-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CargandoComponent, ModalComponent],
  template: `
    <app-cargando *ngIf="estaCargando()"></app-cargando>

    <div *ngIf="!estaCargando()" class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <lucide-icon [img]="iconoUsers" class="w-7 h-7 text-medico-500"></lucide-icon>
            Usuarios de la Clinica
          </h1>
          <p class="text-slate-400 mt-1">{{ usuarios().length }} usuarios registrados</p>
        </div>
        <button (click)="abrirModalCrear()"
          class="flex items-center gap-2 bg-medico-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
          <lucide-icon [img]="iconoPlus" class="w-4 h-4"></lucide-icon> Nuevo Usuario
        </button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Usuario</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Correo</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Rol</th>
              <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              <th class="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let u of usuarios()" class="hover:bg-slate-50/50">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-medico-50 rounded-full flex items-center justify-center">
                    <span class="text-xs font-bold text-medico-600">{{ u.nombreCompleto.charAt(0) }}</span>
                  </div>
                  <span class="text-sm font-medium text-slate-700">{{ u.nombreCompleto }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ u.correoElectronico }}</td>
              <td class="px-6 py-4">
                <span class="text-xs font-medium px-2.5 py-1 rounded-full"
                  [ngClass]="colorRol(u.rolDelSistema)">
                  {{ u.nombreDelRol || u.rolDelSistema }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5">
                  <div class="w-2 h-2 rounded-full" [ngClass]="u.estaCuentaActiva ? 'bg-emerald-500' : 'bg-slate-300'"></div>
                  <span class="text-xs text-slate-500">{{ u.estaCuentaActiva ? 'Activo' : 'Inactivo' }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex gap-1 justify-end">
                  <button (click)="abrirPermisos(u)"
                    class="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors">
                    <lucide-icon [img]="iconoLock" class="w-3 h-3 inline mr-1"></lucide-icon> Permisos
                  </button>
                  <button (click)="abrirCambiarRol(u)"
                    class="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-medico-50 hover:text-medico-600 hover:border-medico-200 transition-colors">
                    <lucide-icon [img]="iconoShield" class="w-3 h-3 inline mr-1"></lucide-icon> Rol
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal crear usuario -->
      <app-modal [estaAbierto]="modalCrear()" (alCerrar)="modalCrear.set(false)" titulo="Nuevo Usuario">
        <div class="space-y-4">
          <div *ngIf="errorCrear()" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 flex items-start gap-2">
            <lucide-icon [img]="iconoAlert" class="w-4 h-4 flex-shrink-0 mt-0.5"></lucide-icon>
            <span>{{ errorCrear() }}</span>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Nombre Completo</label>
            <input type="text" [ngModel]="nuevoUsuario.nombreCompleto"
              (ngModelChange)="nuevoUsuario.nombreCompleto = sanitizarNombreFn($event)"
              maxlength="100" placeholder="Ej. Juan Perez"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20" />
            <p *ngIf="erroresNuevo().nombreCompleto && intentoCrear()" class="mt-1 text-xs text-red-600 flex items-center gap-1">
              <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon> {{ erroresNuevo().nombreCompleto }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Correo Electronico</label>
            <input type="email" [(ngModel)]="nuevoUsuario.correoElectronico" maxlength="150"
              placeholder="correo@clinica.com"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20" />
            <p *ngIf="erroresNuevo().correoElectronico && intentoCrear()" class="mt-1 text-xs text-red-600 flex items-center gap-1">
              <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon> {{ erroresNuevo().correoElectronico }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Contrasena</label>
            <input type="password" [(ngModel)]="nuevoUsuario.contrasena" maxlength="50"
              placeholder="Min 8, mayus, minus y numero"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20" />
            <p *ngIf="erroresNuevo().contrasena && intentoCrear()" class="mt-1 text-xs text-red-600 flex items-center gap-1">
              <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon> {{ erroresNuevo().contrasena }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Rol</label>
            <select [(ngModel)]="nuevoUsuario.idRol"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20">
              <option [ngValue]="0">Seleccionar rol</option>
              <option *ngFor="let r of roles()" [ngValue]="r.idRol">{{ r.nombreDelRol }}</option>
            </select>
            <p *ngIf="erroresNuevo().idRol && intentoCrear()" class="mt-1 text-xs text-red-600 flex items-center gap-1">
              <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon> {{ erroresNuevo().idRol }}
            </p>
          </div>
          <button (click)="crearUsuario()"
            class="w-full bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
            Crear Usuario
          </button>
        </div>
      </app-modal>

      <!-- Modal cambiar rol -->
      <app-modal [estaAbierto]="modalCambiarRol()" (alCerrar)="modalCambiarRol.set(false)" titulo="Cambiar Rol">
        <div class="space-y-4">
          <p class="text-sm text-slate-600">Cambiar rol de <strong>{{ usuarioSeleccionado()?.nombreCompleto }}</strong></p>
          <select [(ngModel)]="rolSeleccionado"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20">
            <option *ngFor="let r of roles()" [ngValue]="r.idRol">{{ r.nombreDelRol }}</option>
          </select>
          <button (click)="cambiarRolUsuario()"
            class="w-full flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
            <lucide-icon [img]="iconoUserCheck" class="w-4 h-4"></lucide-icon> Confirmar Cambio
          </button>
        </div>
      </app-modal>

      <!-- Modal permisos -->
      <div *ngIf="modalPermisos() && usuarioPermisos()" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" (click)="modalPermisos.set(false)"></div>
        <div class="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-slate-100">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-slate-800">Gestion de Permisos</h2>
                <p class="text-sm text-slate-400">Usuario: {{ usuarioPermisos()!.nombreCompleto }} ({{ usuarioPermisos()!.nombreDelRol }})</p>
              </div>
              <button (click)="modalPermisos.set(false)" class="p-1 rounded-lg hover:bg-slate-100">
                <lucide-icon [img]="iconoX" class="w-5 h-5 text-slate-400"></lucide-icon>
              </button>
            </div>
          </div>
          <div class="p-6">
            <div class="bg-slate-50 rounded-lg p-3 mb-4">
              <p class="text-xs font-semibold text-slate-600 mb-1">Rol base: {{ usuarioPermisos()!.nombreDelRol }}</p>
              <p class="text-[10px] text-slate-400">Haz clic en cada celda para conceder, revocar o resetear permisos</p>
            </div>
            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="bg-slate-50">
                    <th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Modulo</th>
                    <th *ngFor="let a of acciones" class="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase w-20">{{ a }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let m of modulos" class="hover:bg-slate-50/50">
                    <td class="px-4 py-3">
                      <span class="text-sm font-medium text-slate-700 capitalize">{{ m }}</span>
                    </td>
                    <td *ngFor="let a of acciones" class="text-center px-3 py-3">
                      <button (click)="togglePermiso(m, a)"
                        class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                        [ngClass]="estilosCelda(m, a)">
                        <div *ngIf="estadoPermiso(m, a) === 'base'" class="w-3 h-3 rounded-full bg-blue-500"></div>
                        <lucide-icon *ngIf="estadoPermiso(m, a) === 'concedido'" [img]="iconoCheck" class="w-4 h-4 text-emerald-600"></lucide-icon>
                        <lucide-icon *ngIf="estadoPermiso(m, a) === 'revocado'" [img]="iconoX" class="w-4 h-4 text-red-500"></lucide-icon>
                        <lucide-icon *ngIf="estadoPermiso(m, a) === 'sin_permiso'" [img]="iconoMinus" class="w-4 h-4 text-slate-300"></lucide-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="flex gap-3 p-6 pt-0">
            <button (click)="permisosPersonalizadosState.set({})"
              class="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
              Limpiar personalizados
            </button>
            <div class="flex-1"></div>
            <button (click)="modalPermisos.set(false)"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button (click)="guardarPermisos()"
              class="flex items-center gap-2 px-5 py-2 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
              <lucide-icon [img]="iconoCheck" class="w-4 h-4"></lucide-icon> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaginaUsuariosClinicaComponent {
  private readonly usuarioService = inject(UsuarioClinicaService);
  private readonly rolService = inject(RolService);
  private readonly autenticacion = inject(AutenticacionService);

  iconoUsers = Users;
  iconoPlus = Plus;
  iconoShield = Shield;
  iconoUserCheck = UserCheck;
  iconoLock = Lock;
  iconoCheck = Check;
  iconoX = X;
  iconoMinus = Minus;
  iconoAlert = AlertCircle;

  modulos = [...MODULOS_DISPONIBLES];
  acciones = [...ACCIONES_DISPONIBLES];

  sanitizarNombreFn = sanitizarNombre;

  usuarios = signal<UsuarioDeClinica[]>([]);
  roles = signal<Rol[]>([]);
  estaCargando = signal(true);

  modalCrear = signal(false);
  modalCambiarRol = signal(false);
  modalPermisos = signal(false);

  nuevoUsuario = { nombreCompleto: '', correoElectronico: '', contrasena: '', idRol: 0 };
  intentoCrear = signal(false);
  errorCrear = signal('');

  erroresNuevo = computed(() => ({
    nombreCompleto: validarNombre(this.nuevoUsuario.nombreCompleto, 'El nombre completo'),
    correoElectronico: validarCorreo(this.nuevoUsuario.correoElectronico, true),
    contrasena: validarContrasena(this.nuevoUsuario.contrasena),
    idRol: this.nuevoUsuario.idRol > 0 ? null : 'Debes seleccionar un rol',
  }));

  usuarioSeleccionado = signal<UsuarioDeClinica | null>(null);
  rolSeleccionado = 0;

  usuarioPermisos = signal<PermisosUsuarioRespuesta | null>(null);
  permisosBaseState = signal<any>({});
  permisosPersonalizadosState = signal<any>({});

  constructor() {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.estaCargando.set(true);
    this.usuarioService.listarUsuarios().subscribe({
      next: (u) => this.usuarios.set(u)
    });
    this.rolService.listarRoles().subscribe({
      next: (r) => {
        this.roles.set(r);
        this.estaCargando.set(false);
      },
      error: () => this.estaCargando.set(false)
    });
  }

  abrirModalCrear(): void {
    this.nuevoUsuario = { nombreCompleto: '', correoElectronico: '', contrasena: '', idRol: 0 };
    this.intentoCrear.set(false);
    this.errorCrear.set('');
    this.modalCrear.set(true);
  }

  crearUsuario(): void {
    this.intentoCrear.set(true);
    const errores = this.erroresNuevo();
    if (Object.values(errores).some(e => !!e)) return;

    const rolElegido = this.roles().find(r => r.idRol === this.nuevoUsuario.idRol);
    this.usuarioService.crearUsuario({
      nombreCompleto: this.nuevoUsuario.nombreCompleto.trim(),
      correoElectronico: this.nuevoUsuario.correoElectronico.trim(),
      contrasena: this.nuevoUsuario.contrasena,
      idRol: this.nuevoUsuario.idRol,
      rolDelSistema: rolElegido?.nombreDelRol || 'Medico'
    }).subscribe({
      next: () => {
        this.modalCrear.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        this.errorCrear.set(err?.error?.mensaje || err?.error?.message || 'No se pudo crear el usuario');
      }
    });
  }

  abrirCambiarRol(usuario: UsuarioDeClinica): void {
    this.usuarioSeleccionado.set(usuario);
    this.rolSeleccionado = usuario.idRol;
    this.modalCambiarRol.set(true);
  }

  cambiarRolUsuario(): void {
    const u = this.usuarioSeleccionado();
    if (!u || !this.rolSeleccionado) return;
    this.usuarioService.cambiarRol(u.idUsuario, { idRol: this.rolSeleccionado }).subscribe({
      next: () => {
        this.modalCambiarRol.set(false);
        this.cargarDatos();
      }
    });
  }

  abrirPermisos(usuario: UsuarioDeClinica): void {
    this.usuarioService.obtenerPermisos(usuario.idUsuario).subscribe({
      next: (datos) => {
        this.usuarioPermisos.set(datos);
        try { this.permisosBaseState.set(JSON.parse(datos.permisosDelRolBase || '{}')); } catch { this.permisosBaseState.set({}); }
        try { this.permisosPersonalizadosState.set(JSON.parse(datos.permisosPersonalizados || '{}')); } catch { this.permisosPersonalizadosState.set({}); }
        this.modalPermisos.set(true);
      },
      error: () => alert('Error al cargar permisos')
    });
  }

  estadoPermiso(modulo: string, accion: string): 'base' | 'concedido' | 'revocado' | 'sin_permiso' {
    const person = this.permisosPersonalizadosState();
    const tienePersonalizado = person[modulo]?.[accion] !== undefined;
    if (tienePersonalizado) {
      return person[modulo][accion] ? 'concedido' : 'revocado';
    }
    return this.permisosBaseState()[modulo]?.[accion] ? 'base' : 'sin_permiso';
  }

  estilosCelda(modulo: string, accion: string): string {
    const estado = this.estadoPermiso(modulo, accion);
    const mapa: Record<string, string> = {
      base: 'bg-blue-50 hover:bg-blue-100',
      concedido: 'bg-emerald-100 hover:bg-emerald-200',
      revocado: 'bg-red-100 hover:bg-red-200',
      sin_permiso: 'bg-slate-50 hover:bg-slate-100',
    };
    return mapa[estado];
  }

  esMismoUsuario = computed(() =>
    this.usuarioPermisos()?.idUsuario === this.autenticacion.obtenerUsuario()?.idUsuario
  );

  togglePermiso(modulo: string, accion: string): void {
    if (this.esMismoUsuario() && (modulo === 'usuarios' || modulo === 'roles')) {
      alert('No puedes modificar tus propios permisos de Usuarios y Roles');
      return;
    }

    const estadoActual = this.estadoPermiso(modulo, accion);
    this.permisosPersonalizadosState.update(prev => {
      const nuevo = JSON.parse(JSON.stringify(prev));
      if (!nuevo[modulo]) nuevo[modulo] = {};

      if (accion === 'ver') {
        if (estadoActual === 'base' || estadoActual === 'concedido') {
          nuevo[modulo] = { ver: false, crear: false, editar: false, eliminar: false };
        } else {
          delete nuevo[modulo];
          if (Object.keys(nuevo).length === 0) return {};
        }
      } else {
        if (estadoActual === 'base') {
          nuevo[modulo][accion] = false;
        } else if (estadoActual === 'sin_permiso') {
          nuevo[modulo][accion] = true;
          const verBase = this.permisosBaseState()[modulo]?.ver;
          if (!verBase && !nuevo[modulo]?.ver) nuevo[modulo].ver = true;
        } else {
          delete nuevo[modulo][accion];
          if (Object.keys(nuevo[modulo]).length === 0) delete nuevo[modulo];
        }
      }
      return nuevo;
    });
  }

  guardarPermisos(): void {
    const u = this.usuarioPermisos();
    if (!u) return;
    if (this.esMismoUsuario()) {
      alert('No puedes guardar permisos personalizados sobre tu propia cuenta');
      return;
    }
    this.usuarioService.guardarPermisosPersonalizados(u.idUsuario, {
      permisosPersonalizadosJSON: JSON.stringify(this.permisosPersonalizadosState())
    }).subscribe({
      next: () => {
        this.modalPermisos.set(false);
        this.cargarDatos();
      }
    });
  }

  colorRol(rol: string): string {
    if (rol === 'Administrador') return 'bg-amber-50 text-amber-600';
    if (rol === 'Medico') return 'bg-medico-50 text-medico-600';
    return 'bg-slate-100 text-slate-600';
  }
}
