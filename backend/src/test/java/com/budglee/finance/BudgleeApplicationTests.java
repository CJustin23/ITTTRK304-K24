package com.budglee.finance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class BudgleeApplicationTests {

    @Autowired
    private Environment environment;
    @Test
    void contextLoads() {
        assertNotNull(environment,
                "Spring Environment phải được khởi tạo");
    }


    @Test
    void shouldActivateTestProfile() {
        assertTrue(
                environment.acceptsProfiles(
                        org.springframework.core.env.Profiles.of("test")
                ),
                "Profile test phải được kích hoạt"
        );
    }
}
