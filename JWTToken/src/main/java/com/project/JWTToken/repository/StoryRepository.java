package com.project.JWTToken.repository;

import com.project.JWTToken.model.Story;
import com.project.JWTToken.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByUser(User user);

    List<Story> findByUserIdOrderByCreatedAtDesc(Integer userId);

    @Query("SELECT s FROM Story s WHERE s.createdAt > ?1 ORDER BY s.createdAt DESC")
    List<Story> findRecentStories(LocalDateTime since);

    @Query("SELECT s FROM Story s ORDER BY s.createdAt DESC")
    List<Story> findAllRecentStories(Pageable pageable);

    void deleteByCreatedAtBefore(LocalDateTime dateTime);

    default List<Story> findTop100Recent() {
        return findAllRecentStories(Pageable.unpaged());
    }
}
