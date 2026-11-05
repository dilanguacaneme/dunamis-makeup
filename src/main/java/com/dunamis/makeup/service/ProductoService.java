package com.dunamis.makeup.service;

import com.dunamis.makeup.entity.Categoria;
import com.dunamis.makeup.entity.CategoriaProducto;
import com.dunamis.makeup.entity.Marca;
import com.dunamis.makeup.entity.Producto;
import com.dunamis.makeup.exception.ProductoNoEncontradoException;
import com.dunamis.makeup.exception.ReglaNegocioException;
import com.dunamis.makeup.repository.CategoriaRepository;
import com.dunamis.makeup.repository.DetalleFacturaRepository;
import com.dunamis.makeup.repository.MarcaRepository;
import com.dunamis.makeup.repository.ProductoRepository;
import com.dunamis.makeup.dto.producto.ActualizarProductoRequest;
import com.dunamis.makeup.dto.producto.CrearProductoRequest;
import com.dunamis.makeup.dto.producto.ProductoResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private DetalleFacturaRepository detalleFacturaRepository;

    public String normalizarNombre(String nombre) {
        if (nombre == null) {
            return null;
        }
        return nombre.trim().replaceAll("\\s+", " ");
    }

    private String formatearNombreEnum(CategoriaProducto cat) {
        if (cat == null) return null;
        return switch (cat) {
            case ROSTRO -> "Rostro";
            case OJOS -> "Ojos";
            case LABIOS -> "Labios";
            case CEJAS -> "Cejas";
        };
    }

    private Categoria resolverCategoria(Long categoriaId, CategoriaProducto categoriaEnum) {
        if (categoriaId != null) {
            return categoriaRepository.findById(categoriaId)
                    .filter(c -> Boolean.TRUE.equals(c.getActiva()))
                    .orElseThrow(() -> new ReglaNegocioException("La categoría seleccionada no existe o está inactiva"));
        }
        if (categoriaEnum != null) {
            String nombre = formatearNombreEnum(categoriaEnum);
            return categoriaRepository.findByNombreIgnoreCase(nombre)
                    .filter(c -> Boolean.TRUE.equals(c.getActiva()))
                    .orElseGet(() -> categoriaRepository.save(new Categoria(nombre)));
        }
        throw new ReglaNegocioException("La categoría es obligatoria");
    }

    // --- NUEVA API BASADA EN DTOS (Spec 003) ---

    @Transactional
    public ProductoResponse crearProducto(CrearProductoRequest request) {
        String nombreNormalizado = normalizarNombre(request.nombre());
        Marca marca = marcaRepository.findById(request.marcaId())
                .filter(m -> Boolean.TRUE.equals(m.getActiva()))
                .orElseThrow(() -> new ReglaNegocioException("La marca seleccionada no existe o está inactiva"));

        Categoria categoria = resolverCategoria(request.categoriaId(), request.categoria());

        Producto producto = new Producto();
        producto.setNombre(nombreNormalizado);
        producto.setPrecio(request.precio());
        producto.setCantidad(request.cantidad());
        producto.setTotalProducto(request.precio() * request.cantidad());
        producto.setCategoria(categoria);
        producto.setMarca(marca);
        producto.setActivo(true);

        return ProductoResponse.fromEntity(productoRepository.save(producto));
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> buscarProductos(boolean incluirInactivos) {
        List<Producto> lista = incluirInactivos
                ? productoRepository.findAllByOrderByNombreAsc()
                : productoRepository.findByActivoTrueOrderByNombreAsc();
        return lista.stream().map(ProductoResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse buscarProductoPorId(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException(id));
        return ProductoResponse.fromEntity(producto);
    }

    @Transactional
    public ProductoResponse actualizarProducto(Long id, ActualizarProductoRequest request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException(id));

        if (request.nombre() != null && !request.nombre().isBlank()) {
            producto.setNombre(normalizarNombre(request.nombre()));
        }

        if (request.precio() != null) {
            if (request.precio() < 0) {
                throw new ReglaNegocioException("El precio no puede ser negativo");
            }
            producto.setPrecio(request.precio());
        }

        if (request.cantidad() != null) {
            if (request.cantidad() < 0) {
                throw new ReglaNegocioException("Las existencias no pueden ser negativas");
            }
            producto.setCantidad(request.cantidad());
        }

        if (request.categoriaId() != null || request.categoria() != null) {
            Categoria categoria = resolverCategoria(request.categoriaId(), request.categoria());
            producto.setCategoria(categoria);
        }

        if (request.marcaId() != null) {
            Marca marca = marcaRepository.findById(request.marcaId())
                    .filter(m -> Boolean.TRUE.equals(m.getActiva()))
                    .orElseThrow(() -> new ReglaNegocioException("La marca seleccionada no existe o está inactiva"));
            producto.setMarca(marca);
        }

        if (request.activo() != null) {
            producto.setActivo(request.activo());
        }

        if (producto.getPrecio() != null && producto.getCantidad() != null) {
            producto.setTotalProducto(producto.getPrecio() * producto.getCantidad());
        }

        return ProductoResponse.fromEntity(productoRepository.save(producto));
    }

    @Transactional
    public ProductoResponse borrarProductoPorId(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException(id));

        boolean tieneFacturas = detalleFacturaRepository.existsByProductoId(id);
        if (tieneFacturas) {
            // Salvaguarda histórica obligatoria por Principio 5 de la Constitución: Borrado lógico
            producto.setActivo(false);
            Producto guardado = productoRepository.save(producto);
            return ProductoResponse.fromEntity(guardado);
        } else {
            // Si no tiene dependencias contables, se ejecuta borrado seguro
            ProductoResponse response = ProductoResponse.fromEntity(producto);
            productoRepository.deleteById(id);
            return response;
        }
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> productoCercaAcabarse(Integer umbral) {
        int limite = (umbral != null) ? umbral : 0;
        return productoRepository.obtenerProductosPocoStock(limite)
                .stream()
                .map(ProductoResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Double totalInventario() {
        return productoRepository.totalInventario().orElse(0.0);
    }

    // --- MÉTODOS DE COMPATIBILIDAD CON ENTIDADES ---

    @Transactional
    public Producto crearProducto(Producto producto) {
        if (producto.getCantidad() == null || producto.getCantidad() < 0) {
            throw new ReglaNegocioException("Las existencias deben ser cero o más");
        }
        if (producto.getMarca() == null || producto.getMarca().getId() == null) {
            throw new ReglaNegocioException("Seleccione una marca para el producto");
        }
        Marca marca = marcaRepository.findById(producto.getMarca().getId())
                .filter(m -> Boolean.TRUE.equals(m.getActiva()))
                .orElseThrow(() -> new ReglaNegocioException("La marca seleccionada no existe o está inactiva"));
        producto.setMarca(marca);
        producto.setNombre(normalizarNombre(producto.getNombre()));
        producto.setTotalProducto(producto.getCantidad() * producto.getPrecio());
        if (producto.getActivo() == null) {
            producto.setActivo(true);
        }
        return productoRepository.save(producto);
    }

    @Transactional(readOnly = true)
    public List<Producto> buscarProductos() {
        return productoRepository.findByActivoTrueOrderByNombreAsc();
    }

    @Transactional(readOnly = true)
    public Producto buscarProductoEntidadPorId(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException(id));
    }

    @Transactional
    public Producto actualizarProducto(Long id, Producto producto) {
        Producto productoActualizar = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException(id));

        if (producto.getNombre() != null) {
            productoActualizar.setNombre(normalizarNombre(producto.getNombre()));
        }
        if (producto.getCantidad() != null) {
            if (producto.getCantidad() < 0) {
                throw new ReglaNegocioException("Las existencias no pueden ser negativas");
            }
            productoActualizar.setCantidad(producto.getCantidad());
        }
        if (producto.getCategoria() != null) {
            productoActualizar.setCategoria(producto.getCategoria());
        }
        if (producto.getPrecio() != null) {
            if (producto.getPrecio() < 0) {
                throw new ReglaNegocioException("El precio no puede ser negativo");
            }
            productoActualizar.setPrecio(producto.getPrecio());
        }
        if (producto.getMarca() != null && producto.getMarca().getId() != null) {
            Marca marca = marcaRepository.findById(producto.getMarca().getId())
                    .filter(m -> Boolean.TRUE.equals(m.getActiva()))
                    .orElseThrow(() -> new ReglaNegocioException("La marca seleccionada no existe o está inactiva"));
            productoActualizar.setMarca(marca);
        }
        if (producto.getActivo() != null) {
            productoActualizar.setActivo(producto.getActivo());
        }
        productoActualizar.setTotalProducto(productoActualizar.getCantidad() * productoActualizar.getPrecio());
        return productoRepository.save(productoActualizar);
    }

    @Transactional(readOnly = true)
    public List<Producto> productoCercaAcabarse() {
        return productoRepository.obtenerProductosPocoStock(0);
    }
}
