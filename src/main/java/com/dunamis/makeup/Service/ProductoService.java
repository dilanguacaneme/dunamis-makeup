package com.dunamis.makeup.Service;

import com.dunamis.makeup.Entity.Producto;
import com.dunamis.makeup.Exeption.InventarioVacioException;
import com.dunamis.makeup.Exeption.ProductoNoEncontradoException;
import com.dunamis.makeup.Repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {
    @Autowired
    private ProductoRepository productoRepository;

    //Create
    public Producto crearProducto (Producto producto){

        //Total del producto
        producto.setTotalProducto(producto.getCantidad() * producto.getPrecio());


        producto.setCantidadInicial(producto.getCantidad());


        return productoRepository.save(producto);
    }

    //Read
    public List<Producto> buscarProductos (){
        return productoRepository.findAll();
    }

    //ReadForId
    public Producto buscarProductoPorId (Long id){

        Optional<Producto> productoBuscar = productoRepository.findById(id);

        if (productoBuscar.isPresent()){
            return productoBuscar.get();
        } else {
            throw new ProductoNoEncontradoException(id);
        }

    }

    //DeletedForId
    public Producto borrarProductoPorId (Long id){
        Optional <Producto> productoAEliminar = productoRepository.findById(id);

        if (productoAEliminar.isPresent()){
            productoRepository.deleteById(id);
            return productoAEliminar.get();

        } else {
            throw new ProductoNoEncontradoException(id);
        }

    }

    //Update
    public Producto actualizarProducto (Long id, Producto producto){

        Optional<Producto> productoEncontrado = productoRepository.findById(id);

        if(productoEncontrado.isPresent()){

            Producto productoActualizar = productoEncontrado.get();

            if (producto.getNombre() != null){
                String nuevoNombre = producto.getNombre();

                productoActualizar.setNombre(nuevoNombre);
            }
            if (producto.getCantidad() != null) {

                int cantidadNueva = producto.getCantidad();
                productoActualizar.setCantidad(cantidadNueva);

            }

            if (producto.getCategoria() != null) {
                productoActualizar.setCategoria(producto.getCategoria());
            }

            if (producto.getPrecio() != null){

                Double precioNuevo = producto.getPrecio();
                productoActualizar.setPrecio(precioNuevo);

            }

            productoActualizar.setTotalProducto(
                    productoActualizar.getCantidad() * productoActualizar.getPrecio());

            productoRepository.save(productoActualizar);
            return productoActualizar;
        } else {
            throw new ProductoNoEncontradoException(id);
        }
    }

    //Producto mas cerca a acabarse

    public List<Producto> productoCercaAcabarse() {




        return productoRepository.obtenerProductosPocoStock();
    }

    //Costo total inventario
    public Double totalInventario (){

        return productoRepository.totalInventario().orElseThrow(InventarioVacioException::new);

    }
}
