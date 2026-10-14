package com.politecnico.caso_de_estudio.Controller;

import com.politecnico.caso_de_estudio.Entity.Factura;
import com.politecnico.caso_de_estudio.Exeption.ProductoInsuficienteException;
import com.politecnico.caso_de_estudio.Exeption.ProductoNoEncontradoException;
import com.politecnico.caso_de_estudio.Service.FacturaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/factura")
public class FacturaController {

    @Autowired
    private FacturaService facturaService;

    @PostMapping("/crear")
    public ResponseEntity<Object> crearFactura(@Valid @RequestBody Factura factura) {
        try {
            Factura facturaCreada = facturaService.crearFactura(factura);
            return ResponseEntity.status(HttpStatus.CREATED).body(facturaCreada);
        } catch (ProductoNoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (ProductoInsuficienteException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
}
