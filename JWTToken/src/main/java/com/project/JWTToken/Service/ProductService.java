package com.project.JWTToken.Service;

import com.project.JWTToken.model.Product;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public List<Product> getProductsByUser(User user) {
        return productRepository.findByUserAndIsSoldFalse(user);
    }

    /** All listings (C2C marketplace browse). */
    public List<Product> getAllProducts() {
        return productRepository.findByIsSoldFalse();
    }

    public Product getProductByIdAndUser(Integer id, User user) {
        return productRepository.findById(id)
                .filter(product -> product.getUser().getId().equals(user.getId()))
                .orElse(null);
    }

    public Product getProductById(Integer id) {
        return productRepository.findById(id)
                .filter(product -> !product.isSold())
                .orElse(null);
    }

    public Product updateProduct(Integer id, Product updatedProduct, User user) {
        Product product = getProductByIdAndUser(id, user);
        if (product != null) {
            product.setName(updatedProduct.getName());
            product.setDescription(updatedProduct.getDescription());
            product.setPrice(updatedProduct.getPrice());
            product.setCategory(updatedProduct.getCategory());
            product.setStockQuantity(updatedProduct.getStockQuantity() == null ? 0 : updatedProduct.getStockQuantity());
            if (updatedProduct.getImageUrl() != null) {
                product.setImageUrl(updatedProduct.getImageUrl());
            }
            if (updatedProduct.getTargetMarket() != null && !updatedProduct.getTargetMarket().isBlank()) {
                product.setTargetMarket(updatedProduct.getTargetMarket());
            }
            product.setMinimumOrderQuantity(updatedProduct.getMinimumOrderQuantity());
            product.setLogisticsSupport(updatedProduct.getLogisticsSupport());
            return productRepository.save(product);
        }
        return null;
    }

    public boolean deleteProduct(Integer id, User user) {
        Product product = getProductByIdAndUser(id, user);
        if (product != null) {
            productRepository.delete(product);
            return true;
        }
        return false;
    }
}
