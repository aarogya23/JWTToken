package com.project.JWTToken.repository;

import com.project.JWTToken.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    @Query("SELECT g FROM Group g LEFT JOIN FETCH g.createdBy ORDER BY g.createdAt DESC")
    List<Group> findAllByOrderByCreatedAtDesc();

    @Query("SELECT g FROM Group g LEFT JOIN FETCH g.createdBy WHERE g.createdBy.id = :userId ORDER BY g.createdAt DESC")
    List<Group> findByCreatedBy_IdOrderByCreatedAtDesc(@Param("userId") Integer userId);
}