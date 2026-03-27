package com.project.JWTToken.Service;

import com.project.JWTToken.dtos.OrderDto;
import com.project.JWTToken.model.Order;
import com.project.JWTToken.model.OrderStatus;
import com.project.JWTToken.model.Product;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.OrderRepository;
import com.project.JWTToken.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final com.project.JWTToken.repository.UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository, com.project.JWTToken.repository.UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderDto buyProduct(Integer productId, User buyerParams) {
        User buyer = userRepository.findById(buyerParams.getId())
                .orElseThrow(() -> new RuntimeException("Buyer not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.isSold()) {
            throw new RuntimeException("Product is already sold");
        }

        if (product.getUser().getId().equals(buyer.getId())) {
            throw new RuntimeException("You cannot buy your own product");
        }

        Order order = Order.builder()
                .buyer(buyer)
                .seller(product.getUser())
                .product(product)
                .price(product.getPrice())
                .productNameSnapshot(product.getName())
                .productDescriptionSnapshot(product.getDescription())
                .productImageUrlSnapshot(product.getImageUrl())
                .productCategorySnapshot(product.getCategory())
                .sellerNameSnapshot(resolveUserName(product.getUser()))
                .sellerBusinessNameSnapshot(product.getUser().getBusinessName())
                .sellerLocationSnapshot(resolveLocation(product.getUser()))
                .buyerNameSnapshot(resolveUserName(buyer))
                .buyerLocationSnapshot(resolveLocation(buyer))
                .status(OrderStatus.PENDING)
                .build();

        product.setSold(true);
        productRepository.save(product);
        Order savedOrder = orderRepository.save(order);

        return mapToDto(savedOrder);
    }

    public List<OrderDto> getBuyerOrders(User buyer) {
        return orderRepository.findByBuyerId(buyer.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<OrderDto> getSellerOrders(User seller) {
        return orderRepository.findBySellerId(seller.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateOrderStatus(Integer orderId, OrderStatus newStatus, User seller) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getSeller().getId().equals(seller.getId())) {
            throw new RuntimeException("Only the seller can update the order status");
        }

        order.setStatus(newStatus);
        refreshOrderSnapshot(order);
        if (newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.COMPLETED) {
            finalizeReceiptAndArchiveProduct(order);
        }
        Order updatedOrder = orderRepository.save(order);
        
        return mapToDto(updatedOrder);
    }

    @Transactional
    public OrderDto confirmOrderPayment(Integer orderId, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
             // Admin or someone else... but let's just make sure it's the buyer
             throw new RuntimeException("Only the buyer can confirm payment");
        }

        order.setStatus(OrderStatus.COMPLETED);
        refreshOrderSnapshot(order);
        finalizeReceiptAndArchiveProduct(order);
        Order updatedOrder = orderRepository.save(order);
        
        return mapToDto(updatedOrder);
    }

    @Transactional
    public void cancelOrderPayment(Integer orderId, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
             throw new RuntimeException("Only the buyer can cancel the order");
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Restock product
        Product product = order.getProduct();
        if (product != null) {
            product.setSold(false);
            productRepository.save(product);
        }
    }

    public List<OrderDto> getAvailableDeliveries() {
        // Find orders that need a driver. Pending or ready.
        return orderRepository.findByStatusIn(List.of(OrderStatus.PENDING, OrderStatus.READY_FOR_PICKUP))
                .stream()
                .filter(o -> o.getDeliveryPerson() == null)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<OrderDto> getMyDeliveries(User courier) {
        return orderRepository.findByDeliveryPersonId(courier.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDto acceptDelivery(Integer orderId, User courierParams) {
        User courier = userRepository.findById(courierParams.getId())
                .orElseThrow(() -> new RuntimeException("Courier not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getDeliveryPerson() != null) {
            throw new RuntimeException("Order has already been accepted by another driver.");
        }

        if (order.getBuyer().getId().equals(courier.getId()) || order.getSeller().getId().equals(courier.getId())) {
             // Let them deliver their own if they really want, but usually block. Let's allow it for simplicity of gig economy or block?
             // Actually buyers can pick up their own items. Let's block sellers delivering their own items if they use gig economy?
             // No reason to block. Let them do whatever.
        }

        order.setDeliveryPerson(courier);
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        Order updated = orderRepository.save(order);
        return mapToDto(updated);
    }

    @Transactional
    public OrderDto updateDeliveryStatus(Integer orderId, OrderStatus newStatus, User courierParams) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getDeliveryPerson() == null || !order.getDeliveryPerson().getId().equals(courierParams.getId())) {
            throw new RuntimeException("You are not authorized to update this delivery.");
        }

        order.setStatus(newStatus);
        refreshOrderSnapshot(order);
        if (newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.COMPLETED) {
            finalizeReceiptAndArchiveProduct(order);
        }
        Order updated = orderRepository.save(order);
        return mapToDto(updated);
    }

    private void refreshOrderSnapshot(Order order) {
        order.setBuyerNameSnapshot(resolveUserName(order.getBuyer()));
        order.setBuyerLocationSnapshot(resolveLocation(order.getBuyer()));
        order.setSellerNameSnapshot(resolveUserName(order.getSeller()));
        order.setSellerBusinessNameSnapshot(order.getSeller().getBusinessName());
        order.setSellerLocationSnapshot(resolveLocation(order.getSeller()));

        if (order.getProduct() != null) {
            order.setProductNameSnapshot(order.getProduct().getName());
            order.setProductDescriptionSnapshot(order.getProduct().getDescription());
            order.setProductImageUrlSnapshot(order.getProduct().getImageUrl());
            order.setProductCategorySnapshot(order.getProduct().getCategory());
        }
    }

    private void finalizeReceiptAndArchiveProduct(Order order) {
        if (order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        if (order.getReceiptNumber() == null || order.getReceiptNumber().isBlank()) {
            order.setReceiptNumber("RCPT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        order.setReceiptIssuedAt(LocalDateTime.now());

        if (order.getProduct() != null) {
            Product deliveredProduct = order.getProduct();
            order.setProduct(null);
            orderRepository.save(order);
            productRepository.delete(deliveredProduct);
        }
    }

    private String resolveUserName(User user) {
        if (user == null) {
            return "Unknown";
        }
        return user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail();
    }

    private String resolveLocation(User user) {
        if (user == null || user.getLocation() == null || user.getLocation().isBlank()) {
            return "Location not provided";
        }
        return user.getLocation();
    }

    private OrderDto mapToDto(Order order) {
        String buyerName = order.getBuyerNameSnapshot() != null && !order.getBuyerNameSnapshot().isBlank()
                ? order.getBuyerNameSnapshot()
                : resolveUserName(order.getBuyer());
        String sellerName = order.getSellerNameSnapshot() != null && !order.getSellerNameSnapshot().isBlank()
                ? order.getSellerNameSnapshot()
                : resolveUserName(order.getSeller());
        String buyerLocation = order.getBuyerLocationSnapshot() != null && !order.getBuyerLocationSnapshot().isBlank()
                ? order.getBuyerLocationSnapshot()
                : resolveLocation(order.getBuyer());
        String sellerLocation = order.getSellerLocationSnapshot() != null && !order.getSellerLocationSnapshot().isBlank()
                ? order.getSellerLocationSnapshot()
                : resolveLocation(order.getSeller());
        String productName = order.getProductNameSnapshot() != null && !order.getProductNameSnapshot().isBlank()
                ? order.getProductNameSnapshot()
                : order.getProduct() != null ? order.getProduct().getName() : "Unknown Item";

        return OrderDto.builder()
                .id(order.getId())
                .buyerId(order.getBuyer().getId())
                .buyerName(buyerName)
                .sellerId(order.getSeller().getId())
                .sellerName(sellerName)
                .sellerBusinessName(
                        order.getSellerBusinessNameSnapshot() != null && !order.getSellerBusinessNameSnapshot().isBlank()
                                ? order.getSellerBusinessNameSnapshot()
                                : order.getSeller().getBusinessName()
                )
                .buyerLocation(buyerLocation)
                .sellerLocation(sellerLocation)
                .deliveryPersonId(order.getDeliveryPerson() != null ? order.getDeliveryPerson().getId() : null)
                .deliveryPersonName(order.getDeliveryPerson() != null ? (order.getDeliveryPerson().getFullName() != null ? order.getDeliveryPerson().getFullName() : order.getDeliveryPerson().getEmail()) : null)
                .productId(order.getProduct() != null ? order.getProduct().getId() : null)
                .productName(productName)
                .productDescription(order.getProductDescriptionSnapshot())
                .productImageUrl(order.getProductImageUrlSnapshot())
                .productCategory(order.getProductCategorySnapshot())
                .price(order.getPrice())
                .status(order.getStatus().name())
                .receiptNumber(order.getReceiptNumber())
                .receiptAvailable(order.getReceiptNumber() != null && !order.getReceiptNumber().isBlank())
                .deliveredAt(order.getDeliveredAt())
                .receiptIssuedAt(order.getReceiptIssuedAt())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
