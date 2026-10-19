import type {
  Producto,
  ProductoInput,
  FacturaInput,
  Factura,
  Usuario,
  Marca,
  MarcaInput,
} from '../types';
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
      if (data.role !== 'ADMIN' && data.role !== 'VENDEDOR') {
        return null;
      }

      return {
        username: data.username,
        fullName: data.fullName || data.username,
        role: data.role,
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
        let errorMsg = 'Usuario o contraseña incorrectos. Verifique sus credenciales de acceso.';
        try {
          const errJson = await res.json();
          if (errJson.message) errorMsg = errJson.message;
        } catch {
          // ignore
        }
        throw new ApiError(errorMsg, res.status);
      }

      // Refresh CSRF after login
      await this.ensureCsrf();

      const user = await this.getCurrentUser(false);
      if (!user) {
        throw new ApiError('No fue posible validar el usuario y su rol después del inicio de sesión.', 401);
      }
      return user;
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

    await this.ensureCsrf();
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
      return 0;
    }

    if (!res.ok) {
      throw new ApiError(`Error al obtener total de inventario (${res.status})`, res.status);
    }

    const data = await res.json();
    return typeof data === 'number' ? data : 0;
  },

  // Products: Low stock products (acabarse) - returns items where cantidad = 0
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
      throw new ApiError(`Error al consultar productos agotados (${res.status})`, res.status);
    }

    return await res.json();
  },

  // Products: Create
  async createProduct(input: ProductoInput, isDemo: boolean): Promise<Producto> {
    if (isDemo) {
      return demoStore.createProduct(input);
    }

    await this.ensureCsrf();
    const token = getXsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const bodyPayload: any = {
      nombre: input.nombre.trim(),
      precio: Number(input.precio),
      cantidad: Math.max(0, Number(input.cantidad)),
      categoria: input.categoria,
    };

    if (input.marca?.id) {
      bodyPayload.marca = { id: input.marca.id };
    }

    const res = await fetch(`${BASE_URL}/producto/crear`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      let errorText = await res.text();
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message) errorText = parsed.message;
      } catch {
        // ignore
      }
      throw new ApiError(errorText || `Error al crear producto (${res.status})`, res.status);
    }

    return await res.json();
  },

  // Products: Update
  async updateProduct(id: number, input: Partial<ProductoInput>, isDemo: boolean): Promise<Producto> {
    if (isDemo) {
      return demoStore.updateProduct(id, input);
    }

    await this.ensureCsrf();
    const token = getXsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const bodyPayload: any = {};
    if (input.nombre !== undefined) bodyPayload.nombre = input.nombre.trim();
    if (input.precio !== undefined) bodyPayload.precio = Number(input.precio);
    if (input.cantidad !== undefined) bodyPayload.cantidad = Math.max(0, Number(input.cantidad));
    if (input.categoria !== undefined) bodyPayload.categoria = input.categoria;
    if (input.marca?.id) bodyPayload.marca = { id: input.marca.id };

    const res = await fetch(`${BASE_URL}/producto/actualizar/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers,
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      let errorText = await res.text();
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message) errorText = parsed.message;
      } catch {
        // ignore
      }
      throw new ApiError(errorText || `Error al actualizar producto (${res.status})`, res.status);
    }

    return await res.json();
  },

  // Products: Delete
  async deleteProduct(id: number, isDemo: boolean): Promise<Producto> {
    if (isDemo) {
      return demoStore.deleteProduct(id);
    }

    await this.ensureCsrf();
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
      let errorText = await res.text();
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message) errorText = parsed.message;
      } catch {
        // ignore
      }
      throw new ApiError(errorText || `Error al eliminar producto (${res.status})`, res.status);
    }

    return await res.json();
  },

  // --- BRANDS API ---
  async getBrands(isDemo: boolean): Promise<Marca[]> {
    if (isDemo) {
      return demoStore.getBrands();
    }

    const res = await fetch(`${BASE_URL}/marcas`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new ApiError(`Error al consultar marcas (${res.status})`, res.status);
    }

    return await res.json();
  },

  async createBrand(input: MarcaInput, isDemo: boolean): Promise<Marca> {
    if (isDemo) {
      return demoStore.createBrand(input);
    }

    await this.ensureCsrf();
    const token = getXsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const res = await fetch(`${BASE_URL}/marcas`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ nombre: input.nombre.trim() }),
    });

    if (!res.ok) {
      let errorText = await res.text();
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message) errorText = parsed.message;
      } catch {
        // ignore
      }
      throw new ApiError(errorText || `Error al crear marca (${res.status})`, res.status);
    }

    return await res.json();
  },

  async updateBrand(id: number, input: Partial<MarcaInput>, isDemo: boolean): Promise<Marca> {
    if (isDemo) {
      return demoStore.updateBrand(id, input);
    }

    await this.ensureCsrf();
    const token = getXsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const res = await fetch(`${BASE_URL}/marcas/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers,
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      let errorText = await res.text();
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message) errorText = parsed.message;
      } catch {
        // ignore
      }
      throw new ApiError(errorText || `Error al actualizar marca (${res.status})`, res.status);
    }

    return await res.json();
  },

  // --- INVOICES API ---
  async getInvoices(isDemo: boolean, userRole?: string, username?: string): Promise<Factura[]> {
    if (isDemo) {
      return demoStore.getInvoices(userRole, username);
    }

    const res = await fetch(`${BASE_URL}/factura/obtener-facturas`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new ApiError(`Error al consultar facturas (${res.status})`, res.status);
    }

    return await res.json();
  },

  async getInvoiceById(id: number, isDemo: boolean, userRole?: string, username?: string): Promise<Factura> {
    if (isDemo) {
      return demoStore.getInvoiceById(id, userRole, username);
    }

    const res = await fetch(`${BASE_URL}/factura/obtener-factura-por-id/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new ApiError(`Error al consultar factura #${id} (${res.status})`, res.status);
    }

    return await res.json();
  },

  async createInvoice(input: FacturaInput, isDemo: boolean, currentUser?: Usuario | null): Promise<Factura> {
    if (isDemo) {
      return demoStore.createInvoice(input, currentUser);
    }

    await this.ensureCsrf();
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
      let errorText = await res.text();
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message) errorText = parsed.message;
      } catch {
        // ignore
      }
      throw new ApiError(errorText || `Error al registrar factura (${res.status})`, res.status);
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
