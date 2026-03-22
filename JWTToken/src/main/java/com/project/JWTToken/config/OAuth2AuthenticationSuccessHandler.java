package com.project.JWTToken.config;

import com.project.JWTToken.Service.AuthenticationService;
import com.project.JWTToken.Service.JwtService;
import com.project.JWTToken.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;
    private final String frontendRedirectBase;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");

        User user = authenticationService.findOrCreateOAuth2User(email, name);

        String jwtToken = jwtService.generateToken(user);

        String base = frontendRedirectBase.endsWith("/")
                ? frontendRedirectBase.substring(0, frontendRedirectBase.length() - 1)
                : frontendRedirectBase;
        String tokenParam = URLEncoder.encode(jwtToken, StandardCharsets.UTF_8);
        String redirectUrl = base + "/auth/callback?token=" + tokenParam;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
