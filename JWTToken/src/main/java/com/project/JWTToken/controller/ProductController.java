package com.project.JWTToken.controller;

import com.project.JWTToken.Service.ProductService;
import com.project.JWTToken.dtos.ProductDto;
import com.project.JWTToken.model.Product;
import com.project.JWTToken.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody @Valid ProductDto dto, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Product product = Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .imageUrl(dto.getImageUrl())
                .user(user)
                .build();
        Product savedProduct = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Product> products = productService.getProductsByUser(user);
        return ResponseEntity.ok(products);
    }

    /** Peer listings: every member’s products (C2C browse). */
    @GetMapping("/browse")
    public ResponseEntity<List<Product>> browseProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable("id") Integer id) {
        Product product = productService.getProductById(id);
        if (product != null) {
            return ResponseEntity.ok(product);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable("id") Integer id, @RequestBody @Valid ProductDto dto, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Product updatedProduct = Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .imageUrl(dto.getImageUrl())
                .build();
        Product product = productService.updateProduct(id, updatedProduct, user);
        if (product != null) {
            return ResponseEntity.ok(product);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") Integer id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        boolean deleted = productService.deleteProduct(id, user);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}