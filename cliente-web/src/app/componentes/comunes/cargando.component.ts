import { Component } from '@angular/core';

@Component({
  selector: 'app-cargando',
  standalone: true,
  template: `
    <div class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-[3px] border-medico-200 border-t-medico-500 rounded-full animate-spin"></div>
    </div>
  `
})
export class CargandoComponent {}
