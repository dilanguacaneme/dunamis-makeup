import type {
  Producto,
  ProductoInput,
  FacturaInput,
  Factura,
  Usuario,
  Marca,
  MarcaInput,
  Categoria,
  CategoriaInput,
  EstadoPagoFactura,
  MedioPago,
} from '../types';

export const INITIAL_DEMO_CATEGORIES: Categoria[] = [
  { id: 1, nombre: 'Rostro', activa: true },
  { id: 2, nombre: 'Ojos', activa: true },
  { id: 3, nombre: 'Labios', activa: true },
  { id: 4, nombre: 'Cejas', activa: true },
  { id: 5, nombre: 'Cuidado Facial', activa: true },
  { id: 6, nombre: 'Accesorios', activa: true },
];

export const INITIAL_DEMO_BRANDS: Marca[] = [
  { id: 1, nombre: 'Trendy', activa: true },
  { id: 2, nombre: 'Purpure', activa: true },
  { id: 3, nombre: 'Milagros', activa: true },
  { id: 4, nombre: 'Magna', activa: true },
];

const INITIAL_DEMO_PRODUCTS: Producto[] = [
  {
    id: 1,
    nombre: 'Base Fluida Satinada Glow Foundation',
    precio: 85000,
    cantidad: 2,
    totalProducto: 170000,
    categoria: INITIAL_DEMO_CATEGORIES[0], // Rostro
    marca: INITIAL_DEMO_BRANDS[1], // Purpure
  },
  {
    id: 2,
    nombre: 'Corrector Cremoso Alta Cobertura Radiant Concealer',
    precio: 48000,
    cantidad: 14,
    totalProducto: 672000,
    categoria: INITIAL_DEMO_CATEGORIES[0], // Rostro
    marca: INITIAL_DEMO_BRANDS[0], // Trendy
  },
  {
    id: 3,
    nombre: 'Polvo Compacto Traslúcido Mineral Velvet',
    precio: 62000,
    cantidad: 6,
    totalProducto: 372000,
    categoria: INITIAL_DEMO_CATEGORIES[0], // Rostro
    marca: INITIAL_DEMO_BRANDS[3], // Magna
  },
  {
    id: 4,
    nombre: 'Pomada Esculpidora de Cejas Brow Sculpt 24h',
    precio: 39000,
    cantidad: 0, // Demonstrates "Agotado" state
    totalProducto: 0,
    categoria: INITIAL_DEMO_CATEGORIES[3], // Cejas
    marca: INITIAL_DEMO_BRANDS[2], // Milagros
  },
  {
    id: 5,
    nombre: 'Gel Fijador Transparente Brow Lamination Effect',
    precio: 34000,
    cantidad: 8,
    totalProducto: 272000,
    categoria: INITIAL_DEMO_CATEGORIES[3], // Cejas
    marca: INITIAL_DEMO_BRANDS[0], // Trendy
  },
  {
    id: 6,
    nombre: 'Lápiz Micro-Precisión de Cejas Hair-Like Strokes',
    precio: 32000,
    cantidad: 2,
    totalProducto: 64000,
    categoria: INITIAL_DEMO_CATEGORIES[3], // Cejas
    marca: INITIAL_DEMO_BRANDS[2], // Milagros
  },
  {
    id: 7,
    nombre: 'Labial Velvet Matte Rouge Rubí',
    precio: 45000,
    cantidad: 12,
    totalProducto: 540000,
    categoria: INITIAL_DEMO_CATEGORIES[2], // Labios
    marca: INITIAL_DEMO_BRANDS[1], // Purpure
  },
  {
    id: 8,
    nombre: 'Tinta Labial Acuosa Nude Rose Long-Wear',
    precio: 38000,
    cantidad: 1,
    totalProducto: 38000,
    categoria: INITIAL_DEMO_CATEGORIES[2], // Labios
    marca: INITIAL_DEMO_BRANDS[0], // Trendy
  },
  {
    id: 9,
    nombre: 'Brillo Hidratante Plumping Lip Oil Berry',
    precio: 42000,
    cantidad: 9,
    totalProducto: 378000,
    categoria: INITIAL_DEMO_CATEGORIES[2], // Labios
    marca: INITIAL_DEMO_BRANDS[3], // Magna
  },
  {
    id: 10,
    nombre: 'Paleta de Sombras Nude & Bronze 12 Tonos',
    precio: 110000,
    cantidad: 5,
    totalProducto: 550000,
    categoria: INITIAL_DEMO_CATEGORIES[1], // Ojos
    marca: INITIAL_DEMO_BRANDS[0], // Trendy
  },
  {
    id: 11,
    nombre: 'Delineador Líquido Plumón Waterproof Intenso',
    precio: 36000,
    cantidad: 3,
    totalProducto: 108000,
    categoria: INITIAL_DEMO_CATEGORIES[1], // Ojos
    marca: INITIAL_DEMO_BRANDS[1], // Purpure
  },
  {
    id: 12,
    nombre: 'Pestañina Máximo Volumen & Curvatura Lash Lift',
    precio: 52000,
    cantidad: 16,
    totalProducto: 832000,
    categoria: INITIAL_DEMO_CATEGORIES[1], // Ojos
    marca: INITIAL_DEMO_BRANDS[2], // Milagros
  },
];

const INITIAL_DEMO_INVOICES: Factura[] = [
  {
    id: 1001,
    cliente: 'Carolina Méndez',
    telefonoCliente: '312 450 7890',
    vendedorNombre: 'Maryuri Andrea Salazar',
    vendedorUsuario: 'maryuri',
    fecha: '2026-10-15',
    total: 133000,
    estadoPago: 'PAGADA',
    valorAbonado: 133000,
    saldoPendiente: 0,
    detalles: [
      {
        id: 1,
        producto: INITIAL_DEMO_PRODUCTS[0],
        cantidad: 1,
        subtotal: 85000,
      },
      {
        id: 2,
        producto: INITIAL_DEMO_PRODUCTS[1],
        cantidad: 1,
        subtotal: 48000,
      },
    ],
  },
  {
    id: 1002,
    cliente: 'Valeria Restrepo',
    telefonoCliente: '301 889 1234',
    vendedorNombre: 'Caterin Rojas Hererra',
    vendedorUsuario: 'caterin',
    fecha: '2026-10-16',
    total: 90000,
    estadoPago: 'PARCIAL',
    valorAbonado: 50000,
    saldoPendiente: 40000,
    detalles: [
      {
        id: 3,
        producto: INITIAL_DEMO_PRODUCTS[6],
        cantidad: 2,
        subtotal: 90000,
      },
    ],
  },
  {
    id: 1003,
    cliente: 'Lucía Fernández',
    telefonoCliente: '315 771 9900',
    vendedorNombre: 'Maryuri Andrea Salazar',
    vendedorUsuario: 'maryuri',
    fecha: '2026-10-18',
    total: 110000,
    estadoPago: 'PENDIENTE',
    valorAbonado: 0,
    saldoPendiente: 110000,
    detalles: [
      {
        id: 4,
        producto: INITIAL_DEMO_PRODUCTS[9],
        cantidad: 1,
        subtotal: 110000,
      },
    ],
  },
  {
    id: 1000,
    cliente: 'Camila Ospina',
    telefonoCliente: '318 901 2233',
    vendedorNombre: 'Caterin Rojas Hererra',
    vendedorUsuario: 'caterin',
    fecha: '2026-09-28',
    total: 86000,
    estadoPago: 'PAGADA',
    valorAbonado: 86000,
    saldoPendiente: 0,
    detalles: [
      {
        id: 5,
        producto: INITIAL_DEMO_PRODUCTS[7],
        cantidad: 1,
        subtotal: 38000,
      },
      {
        id: 6,
        producto: INITIAL_DEMO_PRODUCTS[1],
        cantidad: 1,
        subtotal: 48000,
      },
    ],
  },
  {
    id: 999,
    cliente: 'Daniela Toro',
    telefonoCliente: '320 554 1188',
    vendedorNombre: 'Maryuri Andrea Salazar',
    vendedorUsuario: 'maryuri',
    fecha: '2026-09-14',
    total: 147000,
    estadoPago: 'PAGADA',
    valorAbonado: 147000,
    saldoPendiente: 0,
    detalles: [
      {
        id: 7,
        producto: INITIAL_DEMO_PRODUCTS[2],
        cantidad: 1,
        subtotal: 62000,
      },
      {
        id: 8,
        producto: INITIAL_DEMO_PRODUCTS[0],
        cantidad: 1,
        subtotal: 85000,
      },
    ],
  },
  {
    id: 998,
    cliente: 'Isabella Gómez',
    telefonoCliente: '310 443 9922',
    vendedorNombre: 'Caterin Rojas Hererra',
    vendedorUsuario: 'caterin',
    fecha: '2026-08-22',
    total: 78000,
    estadoPago: 'PAGADA',
    valorAbonado: 78000,
    saldoPendiente: 0,
    detalles: [
      {
        id: 9,
        producto: INITIAL_DEMO_PRODUCTS[4],
        cantidad: 1,
        subtotal: 34000,
      },
      {
        id: 10,
        producto: INITIAL_DEMO_PRODUCTS[8],
        cantidad: 1,
        subtotal: 42000,
      },
    ],
  },
];

export const DEMO_ADMIN_USER: Usuario = {
  username: 'maryuri',
  fullName: 'Maryuri Andrea Salazar',
  role: 'ADMIN',
};

export const DEMO_SELLER_USER: Usuario = {
  username: 'caterin',
  fullName: 'Caterin Rojas Hererra',
  role: 'VENDEDOR',
};

const STORAGE_PRODUCTS_KEY = 'dunamis_demo_inventory_v3';
const STORAGE_CATEGORIES_KEY = 'dunamis_demo_categories_v3';
const STORAGE_BRANDS_KEY = 'dunamis_demo_brands_v3';
const STORAGE_INVOICES_KEY = 'dunamis_demo_invoices_v3';

class DemoStore {
  private categories: Categoria[];
  private products: Producto[];
  private brands: Marca[];
  private invoices: Factura[];

  constructor() {
    this.categories = this.loadCategories();
    this.brands = this.loadBrands();
    this.products = this.loadProducts();
    this.invoices = this.loadInvoices();
  }

  // --- CATEGORIES ---
  private loadCategories(): Categoria[] {
    try {
      const stored = localStorage.getItem(STORAGE_CATEGORIES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_DEMO_CATEGORIES.map((c) => ({ ...c }));
  }

  private saveCategories(): void {
    try {
      localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(this.categories));
    } catch {
      // ignore
    }
  }

  public getCategories(incluirInactivas = false): Categoria[] {
    const list = incluirInactivas
      ? [...this.categories]
      : this.categories.filter((c) => c.activa !== false);
    return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  public getAllCategories(): Categoria[] {
    return [...this.categories].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  public createCategory(input: CategoriaInput): Categoria {
    const nombre = input.nombre.trim().replace(/\s+/g, ' ');
    if (!nombre) {
      throw new Error('El nombre de la categoría es obligatorio');
    }
    const exists = this.categories.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (exists) {
      throw new Error('Ya existe una categoría con ese nombre');
    }
    const nextId = this.categories.length > 0 ? Math.max(...this.categories.map((c) => c.id)) + 1 : 1;
    const newCategory: Categoria = {
      id: nextId,
      nombre,
      activa: true,
    };
    this.categories.push(newCategory);
    this.saveCategories();
    return newCategory;
  }

  public updateCategory(id: number, input: Partial<CategoriaInput>): Categoria {
    const cat = this.categories.find((c) => c.id === id);
    if (!cat) {
      throw new Error('Categoría no encontrada');
    }
    if (input.nombre !== undefined) {
      const nombre = input.nombre.trim().replace(/\s+/g, ' ');
      if (!nombre) {
        throw new Error('El nombre de la categoría es obligatorio');
      }
      const duplicate = this.categories.some(
        (c) => c.id !== id && c.nombre.toLowerCase() === nombre.toLowerCase()
      );
      if (duplicate) {
        throw new Error('Ya existe una categoría con ese nombre');
      }
      cat.nombre = nombre;
    }
    if (input.activa !== undefined) {
      cat.activa = input.activa;
    }
    this.saveCategories();
    return cat;
  }

  // --- BRANDS ---
  private loadBrands(): Marca[] {
    try {
      const stored = localStorage.getItem(STORAGE_BRANDS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_DEMO_BRANDS.map((b) => ({ ...b }));
  }

  private saveBrands(): void {
    try {
      localStorage.setItem(STORAGE_BRANDS_KEY, JSON.stringify(this.brands));
    } catch {
      // ignore
    }
  }

    public getBrands(incluirInactivas = false): Marca[] {
    const list = incluirInactivas
      ? [...this.brands]
      : this.brands.filter((b) => b.activa !== false);
    return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  public getAllBrands(): Marca[] {
    return [...this.brands].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  public createBrand(input: MarcaInput): Marca {
    const nombre = input.nombre.trim().replace(/\s+/g, ' ');
    if (!nombre) {
      throw new Error('El nombre de la marca es obligatorio');
    }
    const exists = this.brands.some((b) => b.nombre.toLowerCase() === nombre.toLowerCase());
    if (exists) {
      throw new Error('Ya existe una marca con ese nombre');
    }
    const nextId = this.brands.length > 0 ? Math.max(...this.brands.map((b) => b.id)) + 1 : 1;
    const newBrand: Marca = {
      id: nextId,
      nombre,
      activa: true,
    };
    this.brands.push(newBrand);
    this.saveBrands();
    return newBrand;
  }

  public updateBrand(id: number, input: Partial<MarcaInput>): Marca {
    const brand = this.brands.find((b) => b.id === id);
    if (!brand) {
      throw new Error('Marca no encontrada');
    }
    if (input.nombre !== undefined) {
      const nombre = input.nombre.trim().replace(/\s+/g, ' ');
      if (!nombre) {
        throw new Error('El nombre de la marca es obligatorio');
      }
      const duplicate = this.brands.some(
        (b) => b.id !== id && b.nombre.toLowerCase() === nombre.toLowerCase()
      );
      if (duplicate) {
        throw new Error('Ya existe una marca con ese nombre');
      }
      brand.nombre = nombre;
    }
    if (input.activa !== undefined) {
      brand.activa = input.activa;
    }
    this.saveBrands();
    return brand;
  }

  // --- PRODUCTS ---
  private loadProducts(): Producto[] {
    try {
      const stored = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (stored) {
        const parsed: Producto[] = JSON.parse(stored);
        return parsed.map((p) => {
          if (typeof p.categoria === 'string') {
            const matched = this.categories.find(
              (c) => c.nombre.toLowerCase() === (p.categoria as string).toLowerCase()
            );
            return {
              ...p,
              categoria: matched || { id: 1, nombre: p.categoria, activa: true },
            };
          }
          return p;
        });
      }
    } catch {
      // ignore
    }
    return INITIAL_DEMO_PRODUCTS.map((p) => ({ ...p }));
  }

  private saveProducts(): void {
    try {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(this.products));
    } catch {
      // ignore
    }
  }

  public getProducts(incluirInactivos = false): Producto[] {
    return incluirInactivos
      ? [...this.products]
      : this.products.filter((p) => p.activo !== false);
  }

  public getProductById(id: number): Producto | undefined {
    return this.products.find((p) => p.id === id);
  }

  public createProduct(input: ProductoInput): Producto {
    if (input.cantidad < 0) {
      throw new Error('Las existencias deben ser cero o más');
    }
    if (!input.marca?.id) {
      throw new Error('Seleccione una marca para el producto');
    }
    const marca = this.brands.find((b) => b.id === input.marca?.id && b.activa !== false);
    if (!marca) {
      throw new Error('La marca seleccionada no existe o está inactiva');
    }

    let categoria: Categoria | undefined;
    if (input.categoriaId !== undefined) {
      categoria = this.categories.find((c) => c.id === input.categoriaId && c.activa !== false);
    } else if (input.categoria !== undefined) {
      if (typeof input.categoria === 'object' && (input.categoria as Categoria).id) {
        categoria = this.categories.find((c) => c.id === (input.categoria as Categoria).id && c.activa !== false);
      } else if (typeof input.categoria === 'string') {
        categoria = this.categories.find(
          (c) => c.nombre.toLowerCase() === (input.categoria as string).toLowerCase() && c.activa !== false
        );
      }
    }

    if (!categoria) {
      throw new Error('La categoría seleccionada no existe o está inactiva');
    }

    const nextId = this.products.length > 0 ? Math.max(...this.products.map((p) => p.id)) + 1 : 1;
    const newProduct: Producto = {
      id: nextId,
      nombre: input.nombre.trim(),
      precio: Number(input.precio),
      cantidad: Math.max(0, Number(input.cantidad)),
      totalProducto: Number(input.precio) * Math.max(0, Number(input.cantidad)),
      categoria,
      marca,
      activo: true,
    };
    this.products.push(newProduct);
    this.saveProducts();
    return newProduct;
  }

  public updateProduct(id: number, input: Partial<ProductoInput>): Producto {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    const current = this.products[index];
    const updatedNombre = input.nombre !== undefined ? input.nombre.trim() : current.nombre;
    const updatedPrecio = input.precio !== undefined ? Number(input.precio) : current.precio;
    let updatedCantidad = current.cantidad;
    if (input.cantidad !== undefined) {
      if (Number(input.cantidad) < 0) {
        throw new Error('Las existencias no pueden ser negativas');
      }
      updatedCantidad = Number(input.cantidad);
    }

    let updatedCategoria = current.categoria;
    if (input.categoriaId !== undefined) {
      const foundCat = this.categories.find((c) => c.id === input.categoriaId && c.activa !== false);
      if (!foundCat) {
        throw new Error('La categoría seleccionada no existe o está inactiva');
      }
      updatedCategoria = foundCat;
    } else if (input.categoria !== undefined) {
      if (typeof input.categoria === 'object' && (input.categoria as Categoria).id) {
        const foundCat = this.categories.find((c) => c.id === (input.categoria as Categoria).id && c.activa !== false);
        if (!foundCat) {
          throw new Error('La categoría seleccionada no existe o está inactiva');
        }
        updatedCategoria = foundCat;
      } else if (typeof input.categoria === 'string') {
        const foundCat = this.categories.find(
          (c) => c.nombre.toLowerCase() === (input.categoria as string).toLowerCase() && c.activa !== false
        );
        if (!foundCat) {
          throw new Error('La categoría seleccionada no existe o está inactiva');
        }
        updatedCategoria = foundCat;
      }
    }

    let updatedMarca = current.marca;
    if (input.marca?.id) {
      const foundMarca = this.brands.find((b) => b.id === input.marca?.id && b.activa !== false);
      if (!foundMarca) {
        throw new Error('La marca seleccionada no existe o está inactiva');
      }
      updatedMarca = foundMarca;
    }

    const updatedActivo = input.activo !== undefined ? input.activo : current.activo !== false;

    const updated: Producto = {
      ...current,
      nombre: updatedNombre,
      precio: updatedPrecio,
      cantidad: updatedCantidad,
      categoria: updatedCategoria,
      marca: updatedMarca,
      totalProducto: updatedPrecio * updatedCantidad,
      activo: updatedActivo,
    };

    this.products[index] = updated;
    this.saveProducts();
    return updated;
  }

  public deleteProduct(id: number): Producto {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    const current = this.products[index];
    const tieneFacturas = this.invoices.some((inv) =>
      inv.detalles?.some((d) => d.producto.id === id)
    );

    if (tieneFacturas) {
      // Borrado lógico para emular el comportamiento seguro de producción (Principio 5)
      current.activo = false;
    } else {
      // Sin facturas asociadas: borrado físico
      this.products.splice(index, 1);
    }

    this.saveProducts();
    return current;
  }

  public getTotalInventory(): number {
    return this.products
      .filter((p) => p.activo !== false)
      .reduce((acc, p) => acc + (p.totalProducto || p.precio * p.cantidad), 0);
  }

  public getLowStockProducts(umbral = 0): Producto[] {
    if (umbral < 0) {
      throw new Error('El umbral no puede ser negativo');
    }
    return this.products.filter((p) => p.activo !== false && p.cantidad <= umbral);
  }

  // --- INVOICES ---
  private loadInvoices(): Factura[] {
    try {
      const stored = localStorage.getItem(STORAGE_INVOICES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_DEMO_INVOICES.map((inv) => ({ ...inv }));
  }

  private saveInvoices(): void {
    try {
      localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(this.invoices));
    } catch {
      // ignore
    }
  }

  public getInvoices(userRole?: string, username?: string): Factura[] {
    if (userRole === 'VENDEDOR' && username) {
      return this.invoices.filter(
        (inv) => (inv.vendedorUsuario || '').toLowerCase() === username.toLowerCase()
      );
    }
    return [...this.invoices];
  }

  public getInvoiceById(id: number, userRole?: string, username?: string): Factura {
    const invoice = this.invoices.find((inv) => inv.id === id);
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    if (
      userRole === 'VENDEDOR' &&
      username &&
      (invoice.vendedorUsuario || '').toLowerCase() !== username.toLowerCase()
    ) {
      throw new Error('No tienes autorización para ver esta factura');
    }
    return invoice;
  }

  public createInvoice(input: FacturaInput, currentUser?: Usuario | null): Factura {
    if (!input.cliente || !input.cliente.trim()) {
      throw new Error('El nombre del cliente es obligatorio');
    }
    if (!input.detalles || input.detalles.length === 0) {
      throw new Error('La factura debe tener al menos un producto');
    }

    // FASE 1: Validación previa atómica de existencias y estado activo
    for (const item of input.detalles) {
      if (!item.cantidad || item.cantidad <= 0) {
        throw new Error('La cantidad de cada producto debe ser mayor que cero');
      }
      const product = this.products.find((p) => p.id === item.producto.id);
      if (!product) {
        throw new Error(`Producto #${item.producto.id} no encontrado`);
      }
      if (product.activo !== undefined && !product.activo) {
        throw new Error(`No se puede facturar el producto "${product.nombre}" porque está inactivo`);
      }
      if (product.cantidad < item.cantidad) {
        throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${product.cantidad} unidades.`);
      }
    }

    // FASE 2: Descuento atómico de existencias y construcción de líneas
    let total = 0;
    const detallesProcesados = [];

    for (const item of input.detalles) {
      const product = this.products.find((p) => p.id === item.producto.id)!;
      product.cantidad -= item.cantidad;
      product.totalProducto = product.cantidad * product.precio;
      const subtotal = item.cantidad * product.precio;
      total += subtotal;

      detallesProcesados.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        producto: { ...product },
        cantidad: item.cantidad,
        subtotal,
      });
    }

    const today = new Date().toISOString();
    const nextId = this.invoices.length > 0 ? Math.max(...this.invoices.map((i) => i.id)) + 1 : 1001;

    // Payment status calculation
    const estadoPago: EstadoPagoFactura = input.estadoPago || 'PAGADA';
    let valorAbonado = 0;
    let saldoPendiente = 0;

    if (estadoPago === 'PAGADA') {
      valorAbonado = total;
      saldoPendiente = 0;
    } else if (estadoPago === 'PENDIENTE') {
      valorAbonado = 0;
      saldoPendiente = total;
    } else if (estadoPago === 'PARCIAL' || estadoPago === 'ABONO_PARCIAL') {
      valorAbonado =
        input.valorAbonado !== undefined ? Number(input.valorAbonado) : Math.round(total / 2);
      saldoPendiente = Math.max(0, total - valorAbonado);
    }

    const newInvoice: Factura = {
      id: nextId,
      cliente: input.cliente.trim(),
      telefonoCliente: input.telefonoCliente ? input.telefonoCliente.trim() : '',
      vendedorNombre: currentUser?.fullName || 'Maryuri Andrea Salazar',
      vendedorUsuario: currentUser?.username || 'maryuri',
      fecha: today,
      total,
      detalles: detallesProcesados,
      estadoPago,
      valorAbonado,
      saldoPendiente,
    };

    this.invoices.unshift(newInvoice);
    this.saveInvoices();
    this.saveProducts();
    return newInvoice;
  }

  public updateInvoicePayment(
    id: number,
    additionalPayment: number,
    medioPago: MedioPago = 'EFECTIVO',
    notas?: string,
    currentUser?: Usuario | null
  ): Factura {
    const invoice = this.invoices.find((inv) => inv.id === id);
    if (!invoice) {
      throw new Error(`Factura #${id} no encontrada`);
    }

    if (
      currentUser?.role === 'VENDEDOR' &&
      invoice.vendedorUsuario &&
      currentUser.username &&
      invoice.vendedorUsuario.toLowerCase() !== currentUser.username.toLowerCase()
    ) {
      throw new Error('Acceso denegado: no tiene permisos para abonar a una factura de otro vendedor');
    }

    if (invoice.anulada) {
      throw new Error('No es posible registrar abonos en una factura anulada');
    }

    if (additionalPayment <= 0) {
      throw new Error('El monto del abono debe ser mayor a cero');
    }

    const currentAbonado =
      invoice.valorAbonado !== undefined
        ? invoice.valorAbonado
        : invoice.estadoPago === 'PAGADA'
        ? invoice.total
        : 0;

    const currentSaldo =
      invoice.saldoPendiente !== undefined
        ? invoice.saldoPendiente
        : Math.max(0, invoice.total - currentAbonado);

    if (currentSaldo <= 0 || invoice.estadoPago === 'PAGADA') {
      throw new Error(`La factura #${id} ya se encuentra totalmente pagada`);
    }

    if (additionalPayment > currentSaldo) {
      throw new Error(`El abono ($${additionalPayment}) supera el saldo pendiente ($${currentSaldo})`);
    }

    const newAbonado = Math.min(invoice.total, currentAbonado + additionalPayment);
    const newSaldo = Math.max(0, invoice.total - newAbonado);
    const newEstado: EstadoPagoFactura = newSaldo === 0 ? 'PAGADA' : 'PARCIAL';

    invoice.valorAbonado = newAbonado;
    invoice.saldoPendiente = newSaldo;
    invoice.estadoPago = newEstado;

    if (!invoice.abonos) {
      invoice.abonos = [];
    }
    invoice.abonos.push({
      id: Date.now(),
      facturaId: invoice.id,
      monto: additionalPayment,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      medioPago,
      notas: notas || null,
    });

    this.saveInvoices();
    return invoice;
  }

  public cancelInvoice(id: number, motivo?: string, currentUser?: Usuario | null): Factura {
    const invoice = this.invoices.find((inv) => inv.id === id);
    if (!invoice) {
      throw new Error(`Factura #${id} no encontrada`);
    }

    if (currentUser?.role === 'VENDEDOR') {
      throw new Error('Acceso denegado: solo los administradores pueden anular facturas');
    }

    if (invoice.anulada) {
      throw new Error(`La factura #${id} ya se encuentra anulada`);
    }

    // Restituir inventario de cada producto vendido
    if (invoice.detalles) {
      for (const d of invoice.detalles) {
        const prod = this.products.find((p) => p.id === d.producto.id);
        if (prod) {
          prod.cantidad += d.cantidad;
          prod.totalProducto = prod.cantidad * prod.precio;
        }
      }
      this.saveProducts();
    }

    invoice.anulada = true;
    invoice.fechaAnulacion = new Date().toISOString();
    invoice.motivoAnulacion = motivo || 'Anulada por la administradora';
    this.saveInvoices();
    return invoice;
  }

  public resetToDefaults(): void {
    this.categories = INITIAL_DEMO_CATEGORIES.map((c) => ({ ...c }));
    this.brands = INITIAL_DEMO_BRANDS.map((b) => ({ ...b }));
    this.products = INITIAL_DEMO_PRODUCTS.map((p) => ({ ...p }));
    this.invoices = INITIAL_DEMO_INVOICES.map((i) => ({ ...i }));
    this.saveCategories();
    this.saveBrands();
    this.saveProducts();
    this.saveInvoices();
  }
}

export const demoStore = new DemoStore();
