package com.project.JWTToken.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    private String imageUrl;

    @NotNull(message = "Price is required")
    private Double price;

    private String category;

    @Builder.Default
    private Integer stockQuantity = 0;

    @Builder.Default
    private String targetMarket = "B2C";

    private Integer minimumOrderQuantity;

    private String logisticsSupport;
}
