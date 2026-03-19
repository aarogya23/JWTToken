package com.project.JWTToken.repository;

import com.project.JWTToken.model.MessageApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageApprovalRequestRepository extends JpaRepository<MessageApprovalRequest, Long> {
    List<MessageApprovalRequest> findByGroupIdAndStatus(Long groupId, String status);
    List<MessageApprovalRequest> findByRecipientIdAndStatus(Long recipientId, String status);
    List<MessageApprovalRequest> findBySenderId(Long senderId);
    List<MessageApprovalRequest> findBySenderIdAndStatus(Long senderId, String status);
    List<MessageApprovalRequest> findByGroupIdAndSenderIdAndStatus(Long groupId, Long senderId, String status);
}