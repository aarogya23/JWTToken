package com.project.JWTToken.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Integer id;
    private Integer buyerId;
    private String buyerName;
    private Integer sellerId;
    private String sellerName;
    private String sellerBusinessName;
    private String buyerLocation;
    private String sellerLocation;
    private Integer deliveryPersonId;
    private String deliveryPersonName;
    private Integer productId;
    private String productName;
    private String productDescription;
    private String productImageUrl;
    private String productCategory;
    private Double price;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentTransactionUuid;
    private String paymentReferenceId;
    private String receiptNumber;
    private Boolean receiptAvailable;
    private LocalDateTime deliveredAt;
    private LocalDateTime receiptIssuedAt;
    private LocalDateTime createdAt;
}
