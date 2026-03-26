package com.project.JWTToken.Service;

import com.project.JWTToken.dtos.LogisticsRequestDto;
import com.project.JWTToken.model.LogisticsRequest;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.LogisticsRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LogisticsRequestService {

    private final LogisticsRequestRepository logisticsRequestRepository;

    public LogisticsRequest createRequest(User requester, LogisticsRequestDto dto) {
        LogisticsRequest request = LogisticsRequest.builder()
                .requester(requester)
                .requesterType(isBlank(dto.getRequesterType()) ? "CUSTOMER" : dto.getRequesterType())
                .marketSegment(isBlank(dto.getMarketSegment()) ? "B2C" : dto.getMarketSegment())
                .businessName(isBlank(dto.getBusinessName()) ? requester.getFullName() : dto.getBusinessName())
                .sourceOrganization(isBlank(dto.getSourceOrganization()) ? dto.getBusinessName() : dto.getSourceOrganization())
                .destinationOrganization(dto.getDestinationOrganization())
                .shipmentType(isBlank(dto.getShipmentType()) ? "General Logistics" : dto.getShipmentType())
                .pickupLocation(dto.getPickupLocation())
                .dropoffLocation(dto.getDropoffLocation())
                .quantity(dto.getQuantity())
                .scheduleWindow(dto.getScheduleWindow())
                .requirements(dto.getRequirements())
                .build();

        return logisticsRequestRepository.save(request);
    }

    public List<LogisticsRequest> getRequestsForUser(User requester) {
        return logisticsRequestRepository.findByRequesterOrderByCreatedAtDesc(requester);
    }

    public List<LogisticsRequest> getAllRequests() {
        return logisticsRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
