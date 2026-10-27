package com.dunamis.makeup.service;

import com.dunamis.makeup.entity.*;
import com.dunamis.makeup.exception.ConflictoEstadoException;
import com.dunamis.makeup.exception.ProductoInsuficienteException;
import com.dunamis.makeup.exception.ProductoNoEncontradoException;
import com.dunamis.makeup.exception.RecursoNoEncontradoException;
import com.dunamis.makeup.exception.ReglaNegocioException;
import com.dunamis.makeup.repository.AbonoFacturaRepository;
import com.dunamis.makeup.repository.FacturaRepository;
import com.dunamis.makeup.repository.ProductoRepository;
import com.dunamis.makeup.repository.UsuarioRepository;
import com.dunamis.makeup.dto.factura.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class FacturaService {

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AbonoFacturaRepository abonoFacturaRepository;

    @Transactional
    public FacturaResponse crearFactura(CrearFacturaRequest request, String vendedorUsuario) {
        if (request.cliente() == null || request.cliente().isBlank()) {
            throw new ReglaNegocioException("El nombre del cliente es obligatorio");
        }
        if (request.detalles() == null || request.detalles().isEmpty()) {
            throw new ReglaNegocioException("La factura debe tener al menos un producto");
        }

        Factura factura = new Factura();
        factura.setCliente(request.cliente().trim());
        if (request.telefonoCliente() != null && !request.telefonoCliente().isBlank()) {
            factura.setTelefonoCliente(request.telefonoCliente().trim());
        }
        factura.setVendedorUsuario(vendedorUsuario);
        factura.setVendedorNombre(usuarioRepository.findByNombreUsuarioIgnoreCase(vendedorUsuario)
                .map(Usuario::getNombreCompleto)
                .orElse(vendedorUsuario));
        factura.setFecha(LocalDateTime.now());
        factura.setAnulada(false);

        // Consolidar cantidades por producto antes de validar stock
        Map<Long, Integer> cantidadesPorProducto = new LinkedHashMap<>();
        for (CrearDetalleFacturaRequest item : request.detalles()) {
            if (item.productoId() == null) {
                throw new ReglaNegocioException("Cada detalle debe identificar un producto");
            }
            if (item.cantidad() == null || item.cantidad() <= 0) {
                throw new ReglaNegocioException("La cantidad de cada producto debe ser mayor que cero");
            }
            cantidadesPorProducto.merge(item.productoId(), item.cantidad(), Integer::sum);
        }

        // Cargar y validar cada producto (existencia, activo, stock total solicitado)
        Map<Long, Producto> productosCargados = new HashMap<>();
        for (Map.Entry<Long, Integer> entry : cantidadesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            Integer cantidadTotalRequerida = entry.getValue();

            Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new ProductoNoEncontradoException(productoId));

            if (Boolean.FALSE.equals(producto.getActivo())) {
                throw new ReglaNegocioException("El producto '" + producto.getNombre() + "' (id: " + productoId + ") se encuentra inactivo y no puede ser facturado");
            }

            if (producto.getCantidad() < cantidadTotalRequerida) {
                throw new ProductoInsuficienteException(productoId);
            }

            productosCargados.put(productoId, producto);
        }

        // Descontar existencias y persistir productos
        for (Map.Entry<Long, Integer> entry : cantidadesPorProducto.entrySet()) {
            Producto producto = productosCargados.get(entry.getKey());
            int nuevaCantidad = producto.getCantidad() - entry.getValue();
            producto.setCantidad(nuevaCantidad);
            producto.setTotalProducto(nuevaCantidad * producto.getPrecio());
            productoRepository.save(producto);
        }

        // Generar líneas de detalle para la factura
        double totalFactura = 0.0;
        List<DetalleFactura> detallesFactura = new ArrayList<>();
        for (CrearDetalleFacturaRequest item : request.detalles()) {
            Producto producto = productosCargados.get(item.productoId());
            double subtotal = producto.getPrecio() * item.cantidad();

            DetalleFactura detalle = new DetalleFactura();
            detalle.setFactura(factura);
            detalle.setProducto(producto);
            detalle.setCantidad(item.cantidad());
            detalle.setPrecioUnitario(producto.getPrecio());
            detalle.setSubtotal(subtotal);

            detallesFactura.add(detalle);
            totalFactura += subtotal;
        }

        factura.setTotal(totalFactura);
        factura.setDetalles(detallesFactura);

        // Resolver condición financiera de pago y saldos
        EstadoPagoFactura estado = request.estadoPago() != null ? request.estadoPago() : EstadoPagoFactura.PAGADA;
        factura.setEstadoPago(estado);

        if (estado == EstadoPagoFactura.PAGADA) {
            factura.setValorAbonado(totalFactura);
            factura.setSaldoPendiente(0.0);
            MedioPago medio = request.medioPagoInicial() != null ? request.medioPagoInicial() : MedioPago.EFECTIVO;
            AbonoFactura abono = new AbonoFactura(factura, totalFactura, medio, request.notasPago(), vendedorUsuario);
            factura.getAbonos().add(abono);
        } else if (estado == EstadoPagoFactura.PENDIENTE) {
            factura.setValorAbonado(0.0);
            factura.setSaldoPendiente(totalFactura);
        } else if (estado == EstadoPagoFactura.ABONO_PARCIAL) {
            if (request.valorAbonado() == null || request.valorAbonado() <= 0.0 || request.valorAbonado() >= totalFactura) {
                throw new ReglaNegocioException("El valor abonado para abono parcial debe ser mayor a cero y menor al total de la factura");
            }
            double abonado = request.valorAbonado();
            factura.setValorAbonado(abonado);
            factura.setSaldoPendiente(Math.max(0.0, totalFactura - abonado));
            MedioPago medio = request.medioPagoInicial() != null ? request.medioPagoInicial() : MedioPago.EFECTIVO;
            AbonoFactura abono = new AbonoFactura(factura, abonado, medio, request.notasPago(), vendedorUsuario);
            factura.getAbonos().add(abono);
        }

        Factura guardada = facturaRepository.save(factura);
        return FacturaResponse.fromEntity(guardada);
    }

    @Transactional
    public AbonoResponse registrarAbono(Long facturaId, RegistrarAbonoRequest request, String usuarioRegistro, boolean esAdmin) {
        Factura factura = facturaRepository.findById(facturaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura", facturaId));

        if (!esAdmin && !factura.getVendedorUsuario().equalsIgnoreCase(usuarioRegistro)) {
            throw new AccessDeniedException("Acceso denegado: no tiene permisos sobre esta factura");
        }

        if (Boolean.TRUE.equals(factura.getAnulada())) {
            throw new ConflictoEstadoException("No es posible registrar abonos en una factura anulada");
        }

        factura.asegurarValoresPorDefecto();

        if (factura.getEstadoPago() == EstadoPagoFactura.PAGADA || factura.getSaldoPendiente() <= 0.0) {
            throw new ReglaNegocioException("La factura ya se encuentra totalmente pagada");
        }

        if (request.monto() == null || request.monto() <= 0) {
            throw new ReglaNegocioException("El monto del abono debe ser mayor a cero");
        }

        if (request.monto() > factura.getSaldoPendiente()) {
            throw new ReglaNegocioException("El monto del abono ($" + request.monto() + ") supera el saldo pendiente de la factura ($" + factura.getSaldoPendiente() + ")");
        }

        double nuevoAbonado = factura.getValorAbonado() + request.monto();
        double nuevoSaldo = Math.max(0.0, factura.getSaldoPendiente() - request.monto());

        factura.setValorAbonado(nuevoAbonado);
        factura.setSaldoPendiente(nuevoSaldo);

        if (nuevoSaldo <= 0.001) {
            factura.setSaldoPendiente(0.0);
            factura.setEstadoPago(EstadoPagoFactura.PAGADA);
        } else {
            factura.setEstadoPago(EstadoPagoFactura.ABONO_PARCIAL);
        }

        AbonoFactura abono = new AbonoFactura(factura, request.monto(), request.medioPago(), request.notas(), usuarioRegistro);
        AbonoFactura guardado = abonoFacturaRepository.save(abono);
        factura.getAbonos().add(guardado);
        facturaRepository.save(factura);

        return AbonoResponse.fromEntity(guardado);
    }

    @Transactional(readOnly = true)
    public List<AbonoResponse> listarAbonosPorFactura(Long facturaId, String usuario, boolean esAdmin) {
        Factura factura = facturaRepository.findById(facturaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura", facturaId));

        if (!esAdmin && !factura.getVendedorUsuario().equalsIgnoreCase(usuario)) {
            throw new AccessDeniedException("Acceso denegado: no tiene permisos sobre esta factura");
        }

        return abonoFacturaRepository.findByFacturaIdOrderByFechaAscIdAsc(facturaId)
                .stream()
                .map(AbonoResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Factura> listarFacturas(boolean administrador, String vendedorUsuario) {
        return administrador
                ? facturaRepository.findAllByOrderByFechaDescIdDesc()
                : facturaRepository.findByVendedorUsuarioIgnoreCaseOrderByFechaDescIdDesc(vendedorUsuario);
    }

    @Transactional(readOnly = true)
    public Factura buscarFactura(Long id, boolean administrador, String vendedorUsuario) {
        return (administrador
                ? facturaRepository.findById(id)
                : facturaRepository.findByIdAndVendedorUsuarioIgnoreCase(id, vendedorUsuario))
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura", id));
    }

    @Transactional(readOnly = true)
    public List<FacturaResponse> listarFacturasResponse(boolean administrador, String vendedorUsuario) {
        return listarFacturas(administrador, vendedorUsuario).stream()
                .map(FacturaResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public FacturaResponse buscarFacturaResponse(Long id, boolean administrador, String vendedorUsuario) {
        return FacturaResponse.fromEntity(buscarFactura(id, administrador, vendedorUsuario));
    }

    @Transactional
    public FacturaResponse anularFactura(Long id, AnularFacturaRequest request) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Factura", id));

        if (Boolean.TRUE.equals(factura.getAnulada())) {
            throw new ConflictoEstadoException("La factura con id " + id + " ya se encuentra anulada");
        }

        // Restituir existencias a cada producto facturado
        if (factura.getDetalles() != null) {
            for (DetalleFactura detalle : factura.getDetalles()) {
                if (detalle.getProducto() != null) {
                    Producto producto = productoRepository.findById(detalle.getProducto().getId())
                            .orElse(detalle.getProducto());
                    int nuevaCantidad = producto.getCantidad() + detalle.getCantidad();
                    producto.setCantidad(nuevaCantidad);
                    producto.setTotalProducto(nuevaCantidad * producto.getPrecio());
                    productoRepository.save(producto);
                }
            }
        }

        factura.setAnulada(true);
        factura.setFechaAnulacion(LocalDateTime.now());
        factura.setMotivoAnulacion(request != null && request.motivo() != null && !request.motivo().isBlank()
                ? request.motivo().trim()
                : "Anulada por la administradora");

        Factura guardada = facturaRepository.save(factura);
        return FacturaResponse.fromEntity(guardada);
    }
}
