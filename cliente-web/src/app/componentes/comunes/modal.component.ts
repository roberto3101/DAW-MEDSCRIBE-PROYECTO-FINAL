import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="estaAbierto" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" (click)="alCerrar.emit()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 class="text-lg font-semibold text-slate-800">{{ titulo }}</h2>
          <button (click)="alCerrar.emit()" class="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <lucide-icon [img]="iconoX" class="w-5 h-5 text-slate-400"></lucide-icon>
          </button>
        </div>
        <div class="p-6">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() estaAbierto = false;
  @Input() titulo = '';
  @Output() alCerrar = new EventEmitter<void>();
  iconoX = X;
}
