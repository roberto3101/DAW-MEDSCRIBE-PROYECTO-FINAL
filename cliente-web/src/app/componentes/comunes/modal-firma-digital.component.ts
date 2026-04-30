import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { LucideAngularModule, Eraser, Check, X } from 'lucide-angular';

@Component({
  selector: 'app-modal-firma-digital',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="estaAbierto" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" (click)="alCerrar.emit()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div class="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 class="text-base font-semibold text-slate-800">{{ titulo }}</h2>
          <button (click)="alCerrar.emit()" class="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <lucide-icon [img]="iconoX" class="w-5 h-5 text-slate-400"></lucide-icon>
          </button>
        </div>
        <div class="p-5">
          <p class="text-sm text-slate-400 mb-3 text-center">Dibuje su firma en el recuadro</p>
          <canvas
            #canvas
            width="400"
            height="180"
            (mousedown)="iniciarTrazo($event)"
            (mousemove)="continuarTrazo($event)"
            (mouseup)="finalizarTrazo()"
            (mouseleave)="finalizarTrazo()"
            (touchstart)="iniciarTrazo($event)"
            (touchmove)="continuarTrazo($event)"
            (touchend)="finalizarTrazo()"
            style="max-width: 100%; height: auto;"
            class="w-full border-2 border-dashed border-slate-300 rounded-lg cursor-crosshair touch-none bg-white block"
          ></canvas>
        </div>
        <div class="flex gap-3 p-5 pt-0">
          <button (click)="limpiarCanvas()" class="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <lucide-icon [img]="iconoEraser" class="w-4 h-4"></lucide-icon>
            Limpiar
          </button>
          <button (click)="alCerrar.emit()" class="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button (click)="confirmarFirma()" [disabled]="!tieneTrazos"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <lucide-icon [img]="iconoCheck" class="w-4 h-4"></lucide-icon>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  `
})
export class ModalFirmaDigitalComponent implements AfterViewInit {
  @Input() estaAbierto = false;
  @Input() titulo = '';
  @Output() alCerrar = new EventEmitter<void>();
  @Output() alConfirmar = new EventEmitter<string>();

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  iconoX = X;
  iconoEraser = Eraser;
  iconoCheck = Check;

  tieneTrazos = false;
  private dibujando = false;

  ngAfterViewInit(): void {
    setTimeout(() => this.inicializarContexto(), 80);
  }

  ngOnChanges(): void {
    if (this.estaAbierto) {
      setTimeout(() => this.inicializarContexto(), 50);
    }
  }

  private inicializarContexto(): void {
    const canvas = this.canvasRef?.nativeElement;
    const contexto = canvas?.getContext('2d');
    if (canvas && contexto) {
      contexto.lineWidth = 2.5;
      contexto.lineCap = 'round';
      contexto.lineJoin = 'round';
      contexto.strokeStyle = '#1e293b';
      contexto.clearRect(0, 0, canvas.width, canvas.height);
      this.tieneTrazos = false;
      this.dibujando = false;
    }
  }

  private obtenerPosicion(evento: any): { x: number; y: number } {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;
    const clienteX = evento.changedTouches ? evento.changedTouches[0].clientX : evento.clientX;
    const clienteY = evento.changedTouches ? evento.changedTouches[0].clientY : evento.clientY;
    return { x: (clienteX - rect.left) * escalaX, y: (clienteY - rect.top) * escalaY };
  }

  iniciarTrazo(evento: any): void {
    evento.preventDefault();
    this.dibujando = true;
    const contexto = this.canvasRef?.nativeElement.getContext('2d');
    if (contexto) {
      contexto.beginPath();
      const { x, y } = this.obtenerPosicion(evento);
      contexto.moveTo(x, y);
      this.tieneTrazos = true;
    }
  }

  continuarTrazo(evento: any): void {
    evento.preventDefault();
    if (!this.dibujando) return;
    const contexto = this.canvasRef?.nativeElement.getContext('2d');
    if (contexto) {
      const { x, y } = this.obtenerPosicion(evento);
      contexto.lineTo(x, y);
      contexto.stroke();
    }
  }

  finalizarTrazo(): void {
    this.dibujando = false;
    this.canvasRef?.nativeElement.getContext('2d')?.beginPath();
  }

  limpiarCanvas(): void {
    this.inicializarContexto();
  }

  confirmarFirma(): void {
    if (!this.tieneTrazos) return;
    const datosImagen = this.canvasRef?.nativeElement.toDataURL('image/png');
    if (datosImagen) this.alConfirmar.emit(datosImagen);
  }
}
