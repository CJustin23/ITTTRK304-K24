package com.budglee.finance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class BudgleeApplication {

    public static void main(String[] args) {
        SpringApplication.run(BudgleeApplication.class, args);
    }
}
