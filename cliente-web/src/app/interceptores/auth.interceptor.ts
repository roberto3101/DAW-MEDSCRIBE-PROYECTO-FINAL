import { HttpInterceptorFn } from '@angular/common/http';

/** Inyecta el token JWT en cada peticion HTTP si esta disponible. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    const clonado = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(clonado);
  }
  return next(req);
};
