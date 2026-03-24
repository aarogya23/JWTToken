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
    private Integer productId;
    private String productName;
    private Double price;
    private String status;
    private LocalDateTime createdAt;
}
