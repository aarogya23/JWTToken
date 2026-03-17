package com.project.JWTToken.config;

import com.project.JWTToken.Service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public boolean beforeHandshake(org.springframework.http.server.ServerHttpRequest request,
                                  org.springframework.http.server.ServerHttpResponse response,
                                  WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        // Extract token from query parameters
        String query = request.getURI().getQuery();
        if (query != null && query.contains("token=")) {
            String token = query.split("token=")[1].split("&")[0];
            try {
                String username = jwtService.extractUsername(token);
                if (username != null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    if (jwtService.isTokenValid(token, userDetails)) {
                        attributes.put("username", username);
                        System.out.println("WebSocket authenticated as: " + username);
                    }
                }
            } catch (Exception e) {
                System.out.println("WebSocket authentication warning: " + e.getMessage());
                // Continue anyway - allow connection to proceed
            }
        }

        return true; // Allow handshake to proceed regardless of token validation
    }

    @Override
    public void afterHandshake(org.springframework.http.server.ServerHttpRequest request,
                              org.springframework.http.server.ServerHttpResponse response,
                              WebSocketHandler wsHandler, Exception exception) {
        // Nothing to do after handshake

        System.out.println("WebSocket handshake completed");
    }
}