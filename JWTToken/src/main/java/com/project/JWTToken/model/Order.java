package com.project.JWTToken.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_person_id")
    private User deliveryPerson;

    @Column(nullable = false)
    private Double price;

    private String productNameSnapshot;

    @Column(columnDefinition = "LONGTEXT")
    private String productDescriptionSnapshot;

    @Column(columnDefinition = "LONGTEXT")
    private String productImageUrlSnapshot;

    private String productCategorySnapshot;

    private String sellerNameSnapshot;

    private String sellerBusinessNameSnapshot;

    private String sellerLocationSnapshot;

    private String buyerNameSnapshot;

    private String buyerLocationSnapshot;

    @Column(unique = true)
    private String receiptNumber;

    private LocalDateTime deliveredAt;

    private LocalDateTime receiptIssuedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
