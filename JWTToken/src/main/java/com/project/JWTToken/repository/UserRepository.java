package com.project.JWTToken.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.project.JWTToken.model.User;

@Repository
public interface UserRepository extends CrudRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    // You can add more query methods later, examples:
    // boolean existsByEmail(String email);
    // List<User> findByFullNameContainingIgnoreCase(String namePart);
}
