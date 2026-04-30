import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-plantilla-publico',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50">
      <router-outlet></router-outlet>
    </div>
  `
})
export class PlantillaPublicoComponent {}
