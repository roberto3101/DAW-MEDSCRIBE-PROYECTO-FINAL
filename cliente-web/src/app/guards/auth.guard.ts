import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../servicios/autenticacion.service';

export const authGuard: CanActivateFn = () => {
  const autenticacion = inject(AutenticacionService);
  const router = inject(Router);

  if (autenticacion.estaAutenticado()) {
    return true;
  }
  router.navigate(['/iniciar-sesion']);
  return false;
};
