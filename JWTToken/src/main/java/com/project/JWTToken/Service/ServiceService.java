package com.project.JWTToken.Service;

import com.project.JWTToken.model.Service;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;


import java.util.List;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class ServiceService {

    private final ServiceRepository serviceRepository;

    public Service createService(Service service) {
        return serviceRepository.save(service);
    }

    public List<Service> getServicesByUser(User user) {
        return serviceRepository.findByUser(user);
    }

    /** All service listings (C2C marketplace browse). */
    public List<Service> getAllServices() {
        return serviceRepository.findAll();
    }

    public Service getServiceByIdAndUser(Integer id, User user) {
        return serviceRepository.findById(id)
                .filter(service -> service.getUser().equals(user))
                .orElse(null);
    }

    public Service updateService(Integer id, Service updatedService, User user) {
        Service service = getServiceByIdAndUser(id, user);
        if (service != null) {
            service.setName(updatedService.getName());
            service.setDescription(updatedService.getDescription());
            service.setPrice(updatedService.getPrice());
            return serviceRepository.save(service);
        }
        return null;
    }

    public boolean deleteService(Integer id, User user) {
        Service service = getServiceByIdAndUser(id, user);
        if (service != null) {
            serviceRepository.delete(service);
            return true;
        }
        return false;
    }
}