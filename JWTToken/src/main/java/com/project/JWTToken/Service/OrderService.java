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
    private final com.project.JWTToken.repository.UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository, com.project.JWTToken.repository.UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

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

    public OrderDto confirmOrderPayment(Integer orderId, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getBuyer().getId().equals(buyer.getId())) {
             // Admin or someone else... but let's just make sure it's the buyer
             throw new RuntimeException("Only the buyer can confirm payment");
        }

        order.setStatus(OrderStatus.COMPLETED);
        Order updatedOrder = orderRepository.save(order);
        
        return mapToDto(updatedOrder);
    }

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
        product.setSold(false);
        productRepository.save(product);
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

    public OrderDto acceptDelivery(Integer orderId, User courierParams) {
        User courier = userRepository.findById(courierParams.getId())
                .orElseThrow(() -> new RuntimeException("Courier not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getDeliveryPerson() != null) {
            throw new RuntimeException("Order has already been accepted by another driver.");
        }

        if (order.getBuyer().getId().equals(courier.getId()) || order.getProduct().getUser().getId().equals(courier.getId())) {
             // Let them deliver their own if they really want, but usually block. Let's allow it for simplicity of gig economy or block?
             // Actually buyers can pick up their own items. Let's block sellers delivering their own items if they use gig economy?
             // No reason to block. Let them do whatever.
        }

        order.setDeliveryPerson(courier);
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        Order updated = orderRepository.save(order);
        return mapToDto(updated);
    }

    public OrderDto updateDeliveryStatus(Integer orderId, OrderStatus newStatus, User courierParams) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getDeliveryPerson() == null || !order.getDeliveryPerson().getId().equals(courierParams.getId())) {
            throw new RuntimeException("You are not authorized to update this delivery.");
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        return mapToDto(updated);
    }

    private OrderDto mapToDto(Order order) {
        return OrderDto.builder()
                .id(order.getId())
                .buyerId(order.getBuyer().getId())
                .buyerName(order.getBuyer().getFullName() != null ? order.getBuyer().getFullName() : order.getBuyer().getEmail())
                .sellerId(order.getProduct().getUser().getId())
                .sellerName(order.getProduct().getUser().getFullName() != null ? order.getProduct().getUser().getFullName() : order.getProduct().getUser().getEmail())
                .buyerLocation(order.getBuyer().getLocation() != null ? order.getBuyer().getLocation() : "Location not provided")
                .sellerLocation(order.getProduct().getUser().getLocation() != null ? order.getProduct().getUser().getLocation() : "Location not provided")
                .deliveryPersonId(order.getDeliveryPerson() != null ? order.getDeliveryPerson().getId() : null)
                .deliveryPersonName(order.getDeliveryPerson() != null ? (order.getDeliveryPerson().getFullName() != null ? order.getDeliveryPerson().getFullName() : order.getDeliveryPerson().getEmail()) : null)
                .productId(order.getProduct().getId())
                .productName(order.getProduct().getName())
                .price(order.getPrice())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
