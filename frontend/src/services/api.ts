import type { Producto, ProductoInput, FacturaInput, Factura, Usuario } from '../types';
import { demoStore, DEMO_ADMIN_USER } from './demoData';

const BASE_URL = ''; // Relative path leverages Vite dev server proxy or same-origin deployment

function getXsrfToken(): string | null {
  const match = document.cookie.match(/(^|;)\s*XSRF-TOKEN\s*=\s*([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const inventoryApi = {
  // CSRF handshake
  async ensureCsrf(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
      });
      return res.ok;
    } catch (err) {
      console.warn('Backend CSRF check failed:', err);
      return false;
    }
  },

  // Auth: Current logged in user
  async getCurrentUser(isDemo: boolean): Promise<Usuario | null> {
    if (isDemo) {
      return DEMO_ADMIN_USER;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (res.status === 401 || res.status === 403) {
        return null;
      }

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      return {
        username: data.username,
        fullName: data.fullName || data.username,
        role: data.role || 'ADMIN',
      };
    } catch {
      return null;
    }
  },

  // Auth: Login
  async login(username: string, password: string, isDemo: boolean): Promise<Usuario> {
    if (isDemo) {
      return DEMO_ADMIN_USER;
    }

    // Refresh CSRF first
    await this.ensureCsrf();
    const token = getXsrfToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const body = new URLSearchParams();
    body.append('username', username.trim());
    body.append('password', password);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: body.toString(),
      });

      if (!res.ok) {
        let errorMsg = 'Usuario o contraseña incorrectos. Verifique sus credenciales de administradora.';
        try {
          const errJson = await res.json();
          if (errJson.message) errorMsg = errJson.message;
        } catch {
          // ignore
        }
        throw new ApiError(errorMsg, res.status);
      }

      // Refresh CSRF after login as instructed in README
      await this.ensureCsrf();

      const user = await this.getCurrentUser(false);
      return user || { username, fullName: username, role: 'ADMIN' };
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        'No se logró conectar con el backend Spring Boot en http://localhost:8080. Verifique que el servidor esté en ejecución.',
        0
      );
    }
  },

  // Auth: Logout
  async logout(isDemo: boolean): Promise<void> {
    if (isDemo) return;

    const token = getXsrfToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    try {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
    } catch (e) {
      console.warn('Logout network error:', e);
    }
  },

  // Products: Get all
  async getProducts(isDemo: boolean): Promise<Producto[]> {
    if (isDemo) {
      return demoStore.getProducts();
    }

    const res = await fetch(`${BASE_URL}/producto/obtener-productos`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (res.status === 204) {
      return [];
    }

    if (!res.ok) {
      throw new ApiError(`Error al consultar productos (${res.status})`, res.status);
    }

    return await res.json();
  },

  // Products: Total inventory valuation
  async getTotalInventory(isDemo: boolean): Promise<number> {
    if (isDemo) {
      return demoStore.getTotalInventory();
    }

    const res = await fetch(`${BASE_URL}/producto/total-inventario`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404) {
      // Inventario vacio
      return 0;
    }

    if (!res.ok) {
      throw new ApiError(`Error al obtener total de inventario (${res.status})`, res.status);
    }

    const data = await res.json();
    return typeof data === 'number' ? data : 0;
  },

  // Products: Low stock products (acabarse)
  async getLowStockProducts(isDemo: boolean): Promise<Producto[]> {
    if (isDemo) {
      return demoStore.getLowStockProducts();
    }

    const res = await fetch(`${BASE_URL}/producto/acabarse`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new ApiError(`Error al consultar productos por agotarse (${res.status})`, res.status);
    }

    return await res.json();
  },

  // Products: Create
  async createProduct(input: ProductoInput, isDemo: boolean): Promise<Producto> {
    if (isDemo) {
      return demoStore.createProduct(input);
    }

    const token = getXsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const res = await fetch(`${BASE_URL}/producto/crear`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        nombre: input.nombre.trim(),
        precio: Number(input.precio),
        cantidad: Number(input.cantidad),
        categoria: input.categoria,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new ApiError(`Error al crear producto: ${errorText || res.statusText}`, res.status);
    }

    return await res.json();
  },

  // Products: Update
  async updateProduct(id: number, input: Partial<ProductoInput>, isDemo: boolean): Promise<Producto> {
    if (isDemo) {
      return demoStore.updateProduct(id, input);
    }

    const token = getXsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const res = await fetch(`${BASE_URL}/producto/actualizar/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers,
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new ApiError(`Error al actualizar producto: ${errorText || res.statusText}`, res.status);
    }

    return await res.json();
  },

  // Products: Delete
  async deleteProduct(id: number, isDemo: boolean): Promise<Producto> {
    if (isDemo) {
      return demoStore.deleteProduct(id);
    }

    const token = getXsrfToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const res = await fetch(`${BASE_URL}/producto/borrar-producto-por-id/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new ApiError(`Error al eliminar producto: ${errorText || res.statusText}`, res.status);
    }

    return await res.json();
  },

  // Invoice / Sale: Create
  async createInvoice(input: FacturaInput, isDemo: boolean): Promise<Factura> {
    if (isDemo) {
      return demoStore.createInvoice(input);
    }

    const token = getXsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const res = await fetch(`${BASE_URL}/factura/crear`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new ApiError(`Error al registrar factura: ${errorText || res.statusText}`, res.status);
    }

    return await res.json();
  },

  // Diagnostic helper to test backend connectivity
  async checkBackendHealth(): Promise<{ online: boolean; message: string }> {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        return { online: true, message: 'Backend Spring Boot conectado en http://localhost:8080' };
      }
      return { online: false, message: `El backend respondió con estado ${res.status}` };
    } catch {
      return {
        online: false,
        message: 'No hay conexión con el backend Spring Boot en http://localhost:8080.',
      };
    }
  },
};
