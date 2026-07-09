package com.thesystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TheSystemApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(TheSystemApiApplication.class, args);
    }
}

