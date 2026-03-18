package com.project.JWTToken.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    /**
     * Redirect root URL to the static index.html page.
     * This allows opening http://localhost:8080/ to show the homepage.
     */
    @GetMapping("/")
    public String index() {
        return "redirect:/index.html";
    }
}
