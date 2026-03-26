package com.project.JWTToken.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogisticsRequestDto {
    private String requesterType;
    private String marketSegment;
    private String businessName;
    private String sourceOrganization;
    private String destinationOrganization;
    private String shipmentType;
    private String pickupLocation;
    private String dropoffLocation;
    private Integer quantity;
    private String scheduleWindow;
    private String requirements;
}
