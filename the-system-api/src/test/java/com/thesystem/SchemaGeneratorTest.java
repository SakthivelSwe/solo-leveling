package com.thesystem;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
public class SchemaGeneratorTest {
    @Test
    public void generateSchema() {
        // Just starting context generates the schema
    }
}
