package com.dunamis.makeup.Service;

import com.dunamis.makeup.Entity.Marca;
import com.dunamis.makeup.Entity.Producto;
import com.dunamis.makeup.Exeption.ProductoNoEncontradoException;
import com.dunamis.makeup.Repository.DetalleFacturaRepository;
import com.dunamis.makeup.Repository.MarcaRepository;
import com.dunamis.makeup.Repository.ProductoRepository;
import com.dunamis.makeup.dto.producto.ActualizarProductoRequest;
import com.dunamis.makeup.dto.producto.CrearProductoRequest;
import com.dunamis.makeup.dto.producto.ProductoResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private DetalleFacturaRepository detalleFacturaRepository;

    public String normalizarNombre(String nombre) {
        if (nombre == null) {
            return null;
        }
        return nombre.trim().replaceAll("\\s+", " ");
    }

    // --- NUEVA API BASADA EN DTOS (Spec 003) ---

    @Transactional
    public ProductoResponse crearProducto(CrearProductoRequest request) {
        String nombreNormalizado = normalizarNombre(request.nombre());
        Marca marca = marcaRepository.findById(request.marcaId())
                .filter(m -> Boolean.TRUE.equals(m.getActiva()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "La marca seleccionada no existe o está inactiva"));

        Producto producto = new Producto();
        producto.setNombre(nombreNormalizado);
        producto.setPrecio(request.precio());
        producto.setCantidad(request.cantidad());
        producto.setCantidadInicial(request.cantidad());
        producto.setTotalProducto(request.precio() * request.cantidad());
        producto.setCategoria(request.categoria());
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
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio no puede ser negativo");
            }
            producto.setPrecio(request.precio());
        }

        if (request.cantidad() != null) {
            if (request.cantidad() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las existencias no pueden ser negativas");
            }
            producto.setCantidad(request.cantidad());
        }

        if (request.categoria() != null) {
            producto.setCategoria(request.categoria());
        }

        if (request.marcaId() != null) {
            Marca marca = marcaRepository.findById(request.marcaId())
                    .filter(m -> Boolean.TRUE.equals(m.getActiva()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "La marca seleccionada no existe o está inactiva"));
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las existencias deben ser cero o más");
        }
        if (producto.getMarca() == null || producto.getMarca().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seleccione una marca para el producto");
        }
        Marca marca = marcaRepository.findById(producto.getMarca().getId())
                .filter(m -> Boolean.TRUE.equals(m.getActiva()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "La marca seleccionada no existe o está inactiva"));
        producto.setMarca(marca);
        producto.setNombre(normalizarNombre(producto.getNombre()));
        producto.setTotalProducto(producto.getCantidad() * producto.getPrecio());
        producto.setCantidadInicial(producto.getCantidad());
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
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las existencias no pueden ser negativas");
            }
            productoActualizar.setCantidad(producto.getCantidad());
        }
        if (producto.getCategoria() != null) {
            productoActualizar.setCategoria(producto.getCategoria());
        }
        if (producto.getPrecio() != null) {
            if (producto.getPrecio() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio no puede ser negativo");
            }
            productoActualizar.setPrecio(producto.getPrecio());
        }
        if (producto.getMarca() != null && producto.getMarca().getId() != null) {
            Marca marca = marcaRepository.findById(producto.getMarca().getId())
                    .filter(m -> Boolean.TRUE.equals(m.getActiva()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "La marca seleccionada no existe o está inactiva"));
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
