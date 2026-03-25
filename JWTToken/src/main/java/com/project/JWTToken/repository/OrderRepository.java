package com.project.JWTToken.repository;

import com.project.JWTToken.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByBuyerId(Integer buyerId);
    List<Order> findByProductUserId(Integer sellerId);
    List<Order> findByStatusIn(List<com.project.JWTToken.model.OrderStatus> statuses);
    List<Order> findByDeliveryPersonId(Integer deliveryPersonId);
}
