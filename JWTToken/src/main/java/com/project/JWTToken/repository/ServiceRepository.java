package com.project.JWTToken.repository;

import com.project.JWTToken.model.Service;
import com.project.JWTToken.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Integer> {
    List<Service> findByUser(User user);
}