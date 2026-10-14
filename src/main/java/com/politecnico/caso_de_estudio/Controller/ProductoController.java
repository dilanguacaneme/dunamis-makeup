package com.politecnico.caso_de_estudio.Controller;

import com.politecnico.caso_de_estudio.Entity.Producto;
import com.politecnico.caso_de_estudio.Exeption.InventarioVacioException;
import com.politecnico.caso_de_estudio.Exeption.ProductoNoEncontradoException;
import com.politecnico.caso_de_estudio.Service.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/producto")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    //Create
    @PostMapping("/crear")
    public ResponseEntity<Producto> crearProducto (@Valid @RequestBody Producto producto){

        Producto productoCreado = productoService.crearProducto(producto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productoCreado);
    }
    //Read
    @GetMapping("/obtener-productos")
    public ResponseEntity<List<Producto> > buscarProducto (){

        List<Producto> lista = productoService.buscarProductos();

        if (lista.isEmpty()){
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity
                .ok(lista);
    }
    //ReadForId
    @GetMapping("/obtener-productos-por-id/{id}")
    public ResponseEntity<Object>  buscarProductoPorId (@PathVariable Long id){

        try {

            Producto producto = productoService.buscarProductoPorId(id);
            return ResponseEntity.ok(producto);
        }
        catch (ProductoNoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());

        }


    }
    //DeletedForId
    @DeleteMapping("/borrar-producto-por-id/{id}")
    public ResponseEntity<Object> borrarProductoPorId (@PathVariable Long id){

        try {

            Producto productoAEliminar = productoService.borrarProductoPorId(id);

            return ResponseEntity.ok(productoAEliminar);

        } catch (ProductoNoEncontradoException e) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    //Update
    @PatchMapping("/actualizar/{id}")
    public ResponseEntity<Object> actualizarProducto ( @PathVariable Long id,
                                                         @RequestBody Producto producto){
        try {
            Producto proActualizado = productoService.actualizarProducto(id, producto);
            return ResponseEntity.ok(proActualizado);
        } catch (ProductoNoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    //Total inventario
    @GetMapping("/total-inventario")
    public ResponseEntity<Object> totalInventario(){

        try {
            Double inventarioTotal = productoService.totalInventario();

            return ResponseEntity.ok(inventarioTotal);
        }catch (InventarioVacioException e){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    //Pronto a acabrse
    @GetMapping("/acabarse")
    public ResponseEntity<List<Producto>> productoCercaAcabarse (){

           List <Producto> lstProntoAAcabar = productoService.productoCercaAcabarse();
        return ResponseEntity.ok(lstProntoAAcabar);
    }

}
