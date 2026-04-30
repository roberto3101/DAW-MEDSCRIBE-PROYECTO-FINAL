import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Componente raiz de la aplicacion MedScribe. */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  titulo = 'MedScribe AI';
}
