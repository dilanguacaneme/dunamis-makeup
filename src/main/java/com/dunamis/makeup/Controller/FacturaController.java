package com.dunamis.makeup.Controller;

import com.dunamis.makeup.Entity.Factura;
import com.dunamis.makeup.Exeption.ProductoInsuficienteException;
import com.dunamis.makeup.Exeption.ProductoNoEncontradoException;
import com.dunamis.makeup.Service.FacturaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import java.util.List;

@RestController
@RequestMapping("/factura")
public class FacturaController {

    @Autowired
    private FacturaService facturaService;

    @PostMapping("/crear")
    public ResponseEntity<Object> crearFactura(@Valid @RequestBody Factura factura, Authentication authentication) {
        try {
            Factura facturaCreada = facturaService.crearFactura(factura, authentication.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(facturaCreada);
        } catch (ProductoNoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (ProductoInsuficienteException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/obtener-facturas")
    public ResponseEntity<List<Factura>> listarFacturas(Authentication authentication) {
        return ResponseEntity.ok(facturaService.listarFacturas(esAdministrador(authentication), authentication.getName()));
    }

    @GetMapping("/obtener-factura-por-id/{id}")
    public ResponseEntity<Factura> buscarFactura(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(facturaService.buscarFactura(id, esAdministrador(authentication), authentication.getName()));
    }

    private boolean esAdministrador(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }
}
