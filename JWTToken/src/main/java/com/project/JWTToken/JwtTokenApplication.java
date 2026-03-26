package com.project.JWTToken;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class JwtTokenApplication {
	public static void main(String[] args) {
		SpringApplication.run(JwtTokenApplication.class, args);
	}

	@Bean
	public CommandLineRunner runSqlPatch(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				// Instantly patch the rigid Enum constraint that's causing the truncation crash without dropping user data
				jdbcTemplate.execute("ALTER TABLE orders MODIFY COLUMN status VARCHAR(50);");
				System.out.println("✅ SUCCESSFULLY PATCHED MYSQL ORDERS SCHEMA TO VARCHAR(50)");
			} catch (Exception e) {
				System.out.println("⚠️ SQL Schema Patch Note: " + e.getMessage());
			}
		};
	}
}
