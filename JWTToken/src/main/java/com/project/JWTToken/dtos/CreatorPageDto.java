package com.project.JWTToken.dtos;

import com.project.JWTToken.model.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorPageDto {
    private Integer ownerId;
    private String fullName;
    private String businessName;
    private String bio;
    private String location;
    private String profileImage;
    private String marketSegment;
    private String logisticsSupport;
    private List<Product> products;
    private List<CreatorPostDto> posts;
}
