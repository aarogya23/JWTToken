package com.project.JWTToken.controller;

import com.project.JWTToken.Service.ServiceService;
import com.project.JWTToken.dtos.ServiceDto;
import com.project.JWTToken.model.Service;
import com.project.JWTToken.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceService serviceService;

    @PostMapping
    public ResponseEntity<Service> createService(@RequestBody @Valid ServiceDto dto, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Service service = Service.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .user(user)
                .build();
        Service savedService = serviceService.createService(service);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedService);
    }

    @GetMapping
    public ResponseEntity<List<Service>> getServices(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Service> services = serviceService.getServicesByUser(user);
        return ResponseEntity.ok(services);
    }

    /** Peer listings: every member’s services (C2C browse). */
    @GetMapping("/browse")
    public ResponseEntity<List<Service>> browseServices() {
        return ResponseEntity.ok(serviceService.getAllServices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Service> getService(@PathVariable("id") Integer id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Service service = serviceService.getServiceByIdAndUser(id, user);
        if (service != null) {
            return ResponseEntity.ok(service);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Service> updateService(@PathVariable("id") Integer id, @RequestBody @Valid ServiceDto dto, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Service updatedService = Service.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .build();
        Service service = serviceService.updateService(id, updatedService, user);
        if (service != null) {
            return ResponseEntity.ok(service);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable("id") Integer id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        boolean deleted = serviceService.deleteService(id, user);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}