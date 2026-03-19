package com.project.JWTToken.Service;

import com.project.JWTToken.model.ChatMessage;
import com.project.JWTToken.model.Group;
import com.project.JWTToken.model.MessageApprovalRequest;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.MessageApprovalRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageApprovalService {

    private final MessageApprovalRequestRepository messageApprovalRequestRepository;
    private final GroupService groupService;
    private final ChatMessageService chatMessageService;

    public MessageApprovalRequest submitRequest(Long groupId, User sender, String messageContent) {
        Group group = groupService.getGroupById(groupId);

        if (!groupService.isApprovedMember(groupId, sender.getEmail()) && !groupService.isGroupAdmin(groupId, sender.getEmail())) {
            throw new RuntimeException("Only approved members or group admin can submit approval requests");
        }

        MessageApprovalRequest request = MessageApprovalRequest.builder()
                .group(group)
                .sender(sender)
                .messageContent(messageContent)
                .status("PENDING")
                .requestedAt(LocalDateTime.now())
                .messageType("GROUP")
                .build();

        return messageApprovalRequestRepository.save(request);
    }

    public List<MessageApprovalRequest> getPendingRequests(Long groupId, User adminUser) {
        Group group = groupService.getGroupById(groupId);

        if (!groupService.isApprovedMember(groupId, adminUser.getEmail())) {
            throw new RuntimeException("Only approved members can view message approval requests");
        }

        return messageApprovalRequestRepository.findByGroupIdAndStatus(groupId, "PENDING");
    }

    public MessageApprovalRequest reviewRequest(Long requestId, User adminUser, boolean approved, String rejectionReason) {
        MessageApprovalRequest request = messageApprovalRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Message approval request not found"));

        if (!groupService.isApprovedMember(request.getGroup().getId(), adminUser.getEmail())) {
            throw new RuntimeException("Only approved members can review message approval requests");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Message approval request is already reviewed");
        }

        request.setReviewedBy(adminUser);
        request.setReviewedAt(LocalDateTime.now());

        if (approved) {
            request.setStatus("APPROVED");

            ChatMessage chatMessage = ChatMessage.builder()
                    .type(ChatMessage.MessageType.CHAT)
                    .content(request.getMessageContent())
                    .sender(request.getSender().getEmail())
                    .room(request.getGroup().getId())
                    .timestamp(LocalDateTime.now())
                    .build();
            chatMessageService.saveMessage(chatMessage, request.getSender().getEmail(), request.getGroup().getId());

        } else {
            request.setStatus("REJECTED");
            request.setRejectionReason(rejectionReason);
        }

        return messageApprovalRequestRepository.save(request);
    }

    public List<MessageApprovalRequest> getUserRequests(Long senderId) {
        return messageApprovalRequestRepository.findBySenderId(senderId);
    }
}
