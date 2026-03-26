package com.project.JWTToken.repository;

import com.project.JWTToken.model.LogisticsRequest;
import com.project.JWTToken.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LogisticsRequestRepository extends JpaRepository<LogisticsRequest, Long> {
    List<LogisticsRequest> findByRequesterOrderByCreatedAtDesc(User requester);
    List<LogisticsRequest> findAllByOrderByCreatedAtDesc();
}
