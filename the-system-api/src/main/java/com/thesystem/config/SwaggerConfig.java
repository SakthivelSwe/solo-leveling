package com.thesystem.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI theSystemOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("THE SYSTEM API")
                        .description("Solo Leveling Life OS — Backend API")
                        .version("1.0.0"));
    }
}

