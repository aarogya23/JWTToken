package com.project.JWTToken.Service;

import com.project.JWTToken.model.*;
import com.project.JWTToken.repository.GroupRepository;
import com.project.JWTToken.repository.GroupMemberRepository;
import com.project.JWTToken.repository.GroupMembershipRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMembershipRequestRepository groupMembershipRequestRepository;

    public Group createGroup(String name, User createdBy) {
        Group group = Group.builder()
                .name(name)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .build();
        Group savedGroup = groupRepository.save(group);
        
        // Add the creator as an approved member automatically
        GroupMember adminMember = GroupMember.builder()
                .group(savedGroup)
                .user(createdBy)
                .joinedAt(LocalDateTime.now())
                .approved(true)
                .approvedBy(createdBy)
                .approvedAt(LocalDateTime.now())
                .build();
        groupMemberRepository.save(adminMember);
        
        return savedGroup;
    }

    public List<Group> getAllGroups() {
        return groupRepository.findAllByOrderByCreatedAtDesc();
    }

    public Group getGroupById(Long id) {
        return groupRepository.findById(id).orElseThrow(() -> new RuntimeException("Group not found"));
    }

    // Request to join a group
    public GroupMembershipRequest requestToJoinGroup(Group group, User user) {
        // Check if user already has a pending request
        var existingRequest = groupMembershipRequestRepository.findByGroupIdAndUserId(group.getId(), user.getId());
        if (existingRequest.isPresent()) {
            throw new RuntimeException("You already have a pending request for this group");
        }

        // Check if user is already a member
        var existingMember = groupMemberRepository.findByGroupAndUser(group, user);
        if (existingMember.isPresent()) {
            throw new RuntimeException("You are already a member of this group");
        }

        GroupMembershipRequest request = GroupMembershipRequest.builder()
                .group(group)
                .user(user)
                .status("PENDING")
                .requestedAt(LocalDateTime.now())
                .build();
        return groupMembershipRequestRepository.save(request);
    }

    // Get pending requests for a group (for admin)
    public List<GroupMembershipRequest> getPendingRequestsForGroup(Long groupId) {
        return groupMembershipRequestRepository.findByGroupIdAndStatus(groupId, "PENDING");
    }

    // Approve membership request
    public GroupMembershipRequest approveMembershipRequest(Long requestId, User adminUser) {
        GroupMembershipRequest request = groupMembershipRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        // Verify the user approving is the admin of the group
        if (!request.getGroup().getCreatedBy().getId().equals(adminUser.getId())) {
            throw new RuntimeException("Only the group admin can approve requests");
        }

        if (!request.getStatus().equals("PENDING")) {
            throw new RuntimeException("Request is not pending");
        }

        // Create approved member
        GroupMember member = GroupMember.builder()
                .group(request.getGroup())
                .user(request.getUser())
                .joinedAt(LocalDateTime.now())
                .approved(true)
                .approvedBy(adminUser)
                .approvedAt(LocalDateTime.now())
                .build();
        groupMemberRepository.save(member);

        // Update request status
        request.setStatus("APPROVED");
        request.setReviewedBy(adminUser);
        request.setReviewedAt(LocalDateTime.now());
        return groupMembershipRequestRepository.save(request);
    }

    // Reject membership request
    public GroupMembershipRequest rejectMembershipRequest(Long requestId, User adminUser, String reason) {
        GroupMembershipRequest request = groupMembershipRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        // Verify the user rejecting is the admin of the group
        if (!request.getGroup().getCreatedBy().getId().equals(adminUser.getId())) {
            throw new RuntimeException("Only the group admin can reject requests");
        }

        if (!request.getStatus().equals("PENDING")) {
            throw new RuntimeException("Request is not pending");
        }

        request.setStatus("REJECTED");
        request.setReviewedBy(adminUser);
        request.setReviewedAt(LocalDateTime.now());
        request.setRejectionReason(reason);
        return groupMembershipRequestRepository.save(request);
    }

    // Get all members of a group (approved only)
    public List<GroupMember> getGroupMembers(Long groupId) {
        return groupMemberRepository.findByGroupIdAndApprovedTrue(groupId);
    }

    // Remove a member from group
    public void removeMemberFromGroup(Long groupId, Integer userId, User adminUser) {
        Group group = getGroupById(groupId);
        
        // Verify admin permission
        if (!group.getCreatedBy().getId().equals(adminUser.getId())) {
            throw new RuntimeException("Only the group admin can remove members");
        }

        GroupMember member = groupMemberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        groupMemberRepository.delete(member);
    }
}