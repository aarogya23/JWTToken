package com.project.JWTToken.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.JWTToken.dtos.EsewaInitiationResponse;
import com.project.JWTToken.model.Order;
import com.project.JWTToken.model.User;
import com.project.JWTToken.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class EsewaPaymentService {

    private static final String SIGNED_FIELDS = "total_amount,transaction_uuid,product_code";

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${esewa.product-code}")
    private String productCode;

    @Value("${esewa.secret-key}")
    private String secretKey;

    @Value("${esewa.form-url}")
    private String formUrl;

    @Value("${esewa.status-url}")
    private String statusUrl;

    @Value("${app.frontend-base-url}")
    private String frontendBaseUrl;

    public EsewaPaymentService(OrderService orderService, OrderRepository orderRepository, ObjectMapper objectMapper) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.objectMapper = objectMapper;
    }

    public EsewaInitiationResponse initiate(Integer productId, User buyer) {
        String transactionUuid = DateTimeFormatter.ofPattern("yyMMdd-HHmmss").format(LocalDateTime.now()) + "-" + productId;
        Order order = orderService.createEsewaOrder(productId, buyer, transactionUuid);
        String totalAmount = formatAmount(order.getPrice());

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("amount", totalAmount);
        fields.put("tax_amount", "0");
        fields.put("product_service_charge", "0");
        fields.put("product_delivery_charge", "0");
        fields.put("total_amount", totalAmount);
        fields.put("transaction_uuid", transactionUuid);
        fields.put("product_code", productCode);
        fields.put("success_url", frontendBaseUrl + "/payments/esewa/success?orderId=" + order.getId());
        fields.put("failure_url", frontendBaseUrl + "/payments/esewa/failure?orderId=" + order.getId());
        fields.put("signed_field_names", SIGNED_FIELDS);
        fields.put("signature", generateSignature(totalAmount, transactionUuid, productCode));

        return EsewaInitiationResponse.builder()
                .orderId(order.getId())
                .action(formUrl)
                .fields(fields)
                .build();
    }

    public Map<String, Object> verify(Integer orderId, String encodedData, User currentUser) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getBuyer().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the buyer can verify this payment");
        }

        Map<String, Object> decoded = decodeEsewaData(encodedData);
        String returnedUuid = String.valueOf(decoded.get("transaction_uuid"));
        if (!returnedUuid.equals(order.getPaymentTransactionUuid())) {
            throw new RuntimeException("Transaction UUID mismatch");
        }

        String returnedSignature = String.valueOf(decoded.get("signature"));
        String expectedSignature = generateResponseSignature(decoded);
        if (!returnedSignature.equals(expectedSignature)) {
            throw new RuntimeException("Invalid eSewa response signature");
        }

        Map<String, Object> statusResponse = checkStatus(order);
        String status = String.valueOf(statusResponse.get("status"));
        if (!"COMPLETE".equalsIgnoreCase(status)) {
            orderService.markEsewaPaymentFailed(orderId);
            throw new RuntimeException("Payment status is " + status);
        }

        String refId = statusResponse.get("ref_id") != null ? String.valueOf(statusResponse.get("ref_id")) : null;
        return Map.of(
                "order", orderService.markEsewaPaymentComplete(orderId, refId),
                "gateway", statusResponse);
    }

    public void cancel(Integer orderId, User currentUser) {
        orderService.cancelOrderPayment(orderId, currentUser);
    }

    private Map<String, Object> checkStatus(Order order) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(statusUrl)
                    .queryParam("product_code", productCode)
                    .queryParam("total_amount", formatAmount(order.getPrice()))
                    .queryParam("transaction_uuid", order.getPaymentTransactionUuid())
                    .build(true)
                    .toUri();

            HttpRequest request = HttpRequest.newBuilder(uri).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new RuntimeException("Failed to verify eSewa payment: " + ex.getMessage(), ex);
        }
    }

    private Map<String, Object> decodeEsewaData(String encodedData) {
        try {
            byte[] decodedBytes = Base64.getDecoder().decode(encodedData);
            return objectMapper.readValue(decodedBytes, new TypeReference<>() {});
        } catch (Exception ex) {
            throw new RuntimeException("Invalid eSewa response payload", ex);
        }
    }

    private String generateResponseSignature(Map<String, Object> decoded) {
        String signedFieldNames = String.valueOf(decoded.get("signed_field_names"));
        String[] fields = signedFieldNames.split(",");
        StringBuilder payload = new StringBuilder();
        for (int i = 0; i < fields.length; i++) {
            String field = fields[i];
            payload.append(field).append("=").append(decoded.get(field));
            if (i < fields.length - 1) {
                payload.append(",");
            }
        }
        return hmacSha256Base64(payload.toString());
    }

    private String generateSignature(String totalAmount, String transactionUuid, String productCode) {
        String payload = "total_amount=" + totalAmount
                + ",transaction_uuid=" + transactionUuid
                + ",product_code=" + productCode;
        return hmacSha256Base64(payload);
    }

    private String hmacSha256Base64(String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new RuntimeException("Could not sign eSewa payload", ex);
        }
    }

    private String formatAmount(Double amount) {
        return String.format(java.util.Locale.US, "%.2f", amount);
    }
}
