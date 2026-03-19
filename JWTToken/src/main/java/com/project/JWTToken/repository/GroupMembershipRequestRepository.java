package com.project.JWTToken.repository;

import com.project.JWTToken.model.GroupMembershipRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMembershipRequestRepository extends JpaRepository<GroupMembershipRequest, Long> {
    List<GroupMembershipRequest> findByGroupIdAndStatus(Long groupId, String status);
    List<GroupMembershipRequest> findByGroupId(Long groupId);
    Optional<GroupMembershipRequest> findByGroupIdAndUserId(Long groupId, Integer userId);
}
