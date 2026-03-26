package com.project.JWTToken.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "logistics_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogisticsRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(nullable = false)
    private String requesterType;

    @Column(nullable = false)
    private String marketSegment;

    @Column(nullable = false)
    private String businessName;

    private String sourceOrganization;

    private String destinationOrganization;

    @Column(nullable = false)
    private String shipmentType;

    @Column(nullable = false)
    private String pickupLocation;

    @Column(nullable = false)
    private String dropoffLocation;

    private Integer quantity;

    private String scheduleWindow;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
