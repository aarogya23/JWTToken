package com.project.JWTToken.repository;

import com.project.JWTToken.model.Product;
import com.project.JWTToken.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    List<Product> findByUser(User user);
    List<Product> findByUserAndIsSoldFalse(User user);
    List<Product> findByIsSoldFalse();
}
