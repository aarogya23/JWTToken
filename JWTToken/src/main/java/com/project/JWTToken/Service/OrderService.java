package com.project.JWTToken.Service;

import com.project.JWTToken.dtos.OrderDto;
import com.project.JWTToken.model.Order;
import com.project.JWTToken.model.OrderStatus;
import com.project.JWTToken.model.Product;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.OrderRepository;
import com.project.JWTToken.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    public OrderDto buyProduct(Integer productId, User buyer) {
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
                .product(product)
                .price(product.getPrice())
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
        return orderRepository.findByProductUserId(seller.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public OrderDto updateOrderStatus(Integer orderId, OrderStatus newStatus, User seller) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getProduct().getUser().getId().equals(seller.getId())) {
            throw new RuntimeException("Only the seller can update the order status");
        }

        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);
        
        return mapToDto(updatedOrder);
    }

    private OrderDto mapToDto(Order order) {
        return OrderDto.builder()
                .id(order.getId())
                .buyerId(order.getBuyer().getId())
                .buyerName(order.getBuyer().getFullName() != null ? order.getBuyer().getFullName() : order.getBuyer().getEmail())
                .productId(order.getProduct().getId())
                .productName(order.getProduct().getName())
                .price(order.getPrice())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
