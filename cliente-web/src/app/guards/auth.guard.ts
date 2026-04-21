import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../servicios/autenticacion.service';

/** Guard funcional: bloquea rutas privadas si no hay sesion. */
export const authGuard: CanActivateFn = () => {
  const autenticacion = inject(AutenticacionService);
  const router = inject(Router);

  if (autenticacion.estaAutenticado()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
