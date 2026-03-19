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
    private final com.project.JWTToken.repository.UserRepository userRepository;

    public Group createGroup(String name, User createdBy) {
        return createGroup(name, createdBy, null);
    }

    public Group createGroup(String name, User createdBy, List<Integer> initialMemberIds) {
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

        if (initialMemberIds != null) {
            for (Integer memberId : initialMemberIds) {
                if (memberId == null || memberId.equals(createdBy.getId())) {
                    continue;
                }

                var userOptional = userRepository.findById(memberId);
                if (userOptional.isEmpty()) continue;

                User user = userOptional.get();

                if (groupMemberRepository.findByGroupAndUser(savedGroup, user).isPresent()) {
                    continue;
                }

                GroupMember member = GroupMember.builder()
                        .group(savedGroup)
                        .user(user)
                        .joinedAt(LocalDateTime.now())
                        .approved(true)
                        .approvedBy(createdBy)
                        .approvedAt(LocalDateTime.now())
                        .build();
                groupMemberRepository.save(member);
            }
        }

        return savedGroup;
    }

    public List<Group> getAllGroups() {
        return groupRepository.findAllByOrderByCreatedAtDesc();
    }

    public Group getGroupById(Long id) {
        return groupRepository.findById(id).orElseThrow(() -> new RuntimeException("Group not found"));
    }

    // Get all approved members of a group
    public List<GroupMember> getGroupMembers(Long groupId) {
        return groupMemberRepository.findByGroupIdAndApprovedTrue(groupId);
    }

    public boolean isGroupAdmin(Long groupId, String email) {
        var group = groupRepository.findById(groupId);
        if (group.isEmpty()) return false;
        var user = userRepository.findByEmail(email);
        return user.isPresent() && group.get().getCreatedBy().getId().equals(user.get().getId());
    }

    public boolean isApprovedMember(Long groupId, String email) {
        var group = groupRepository.findById(groupId);
        if (group.isEmpty()) return false;
        var user = userRepository.findByEmail(email);
        if (user.isEmpty()) return false;
        return groupMemberRepository.findByGroupAndUser(group.get(), user.get())
                .map(GroupMember::isApproved)
                .orElse(false);
    }

    // Remove a member from group
    public void removeMemberFromGroup(Long groupId, Integer userId, User adminUser) {
        Group group = getGroupById(groupId);
        
        // Verify admin permission
        if (!group.getCreatedBy().getId().equals(adminUser.getId())) {
            throw new RuntimeException("Only the group admin can remove members");
        }

        User userToRemove = new User();
        userToRemove.setId(userId);
        
        GroupMember member = groupMemberRepository.findByGroupAndUser(group, userToRemove)
                .orElseThrow(() -> new RuntimeException("Member not found in this group"));

        groupMemberRepository.delete(member);
    }
}