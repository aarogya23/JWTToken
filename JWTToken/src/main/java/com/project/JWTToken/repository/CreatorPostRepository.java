package com.project.JWTToken.repository;

import com.project.JWTToken.model.CreatorPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreatorPostRepository extends JpaRepository<CreatorPost, Integer> {
    List<CreatorPost> findByUserIdOrderByCreatedAtDesc(Integer userId);
}
