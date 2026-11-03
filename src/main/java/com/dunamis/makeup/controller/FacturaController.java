package com.dunamis.makeup.controller;

import com.dunamis.makeup.dto.factura.*;
import com.dunamis.makeup.service.FacturaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/factura")
public class FacturaController {

    @Autowired
    private FacturaService facturaService;

    @PostMapping("/crear")
    public ResponseEntity<FacturaResponse> crearFactura(@Valid @RequestBody CrearFacturaRequest request, Authentication authentication) {
        FacturaResponse facturaCreada = facturaService.crearFactura(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(facturaCreada);
    }

    @GetMapping("/obtener-facturas")
    public ResponseEntity<List<FacturaResponse>> listarFacturas(Authentication authentication) {
        return ResponseEntity.ok(facturaService.listarFacturasResponse(esAdministrador(authentication), authentication.getName()));
    }

    @GetMapping("/obtener-factura-por-id/{id}")
    public ResponseEntity<FacturaResponse> buscarFactura(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(facturaService.buscarFacturaResponse(id, esAdministrador(authentication), authentication.getName()));
    }

    @PostMapping("/{id}/abonos")
    public ResponseEntity<AbonoResponse> registrarAbono(
            @PathVariable Long id,
            @Valid @RequestBody RegistrarAbonoRequest request,
            Authentication authentication) {
        AbonoResponse abono = facturaService.registrarAbono(id, request, authentication.getName(), esAdministrador(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(abono);
    }

    @GetMapping("/{id}/abonos")
    public ResponseEntity<List<AbonoResponse>> listarAbonos(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(facturaService.listarAbonosPorFactura(id, authentication.getName(), esAdministrador(authentication)));
    }

    @PostMapping("/{id}/anular")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacturaResponse> anularFactura(
            @PathVariable Long id,
            @RequestBody(required = false) AnularFacturaRequest request) {
        return ResponseEntity.ok(facturaService.anularFactura(id, request));
    }

    private boolean esAdministrador(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }
}
