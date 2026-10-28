package com.budglee.finance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * DUAN-38: giữ ánh xạ JPA và Flyway V1__init_schema.sql không lệch nhau.
 * Tú định nghĩa bảng bằng SQL, cả nhóm định nghĩa entity bằng annotation. Hai nguồn lệch nhau thì
 * profile prod (ddl-auto: validate) không khởi động được, và lỗi chỉ lộ ra lúc deploy.
 */
@SpringBootTest
@ActiveProfiles("test")
class SchemaContractTest {

    private static final String MIGRATION = "/db/migration/V1__init_schema.sql";
    private static final Pattern CREATE_TABLE =
            Pattern.compile("CREATE TABLE IF NOT EXISTS (\\w+)\\s*\\((.*?)\\n\\);", Pattern.DOTALL);
    private static final Set<String> NOT_A_COLUMN =
            Set.of("FOREIGN", "INDEX", "PRIMARY", "UNIQUE", "CONSTRAINT", "KEY", "--");

    @Autowired
    private jakarta.persistence.EntityManagerFactory entityManagerFactory;

    @Test
    void everyColumnInMigrationIsMappedByAnEntity() throws Exception {
        Map<String, Map<String, Class<?>>> entities = readEntityColumns();

        for (Map.Entry<String, Map<String, String>> tableEntry : readSchemaColumns().entrySet()) {
            String table = tableEntry.getKey();
            Map<String, Class<?>> entityColumns = entities.get(table);
            assertThat(entityColumns).as("không có entity nào ánh xạ tới bảng %s", table).isNotNull();

            Set<String> missing = new TreeSet<>(tableEntry.getValue().keySet());
            missing.removeAll(entityColumns.keySet());
            assertThat(missing).as("bảng %s có cột trong V1 nhưng entity không ánh xạ", table).isEmpty();
        }
    }

    @Test
    void entitiesDoNotInventColumnsMissingFromMigration() throws Exception {
        Map<String, Map<String, String>> schema = readSchemaColumns();

        for (Map.Entry<String, Map<String, Class<?>>> entityEntry : readEntityColumns().entrySet()) {
            String table = entityEntry.getKey();
            assertThat(schema.keySet()).as("entity trỏ tới bảng %s không có trong V1", table).contains(table);

            Set<String> extra = new TreeSet<>(entityEntry.getValue().keySet());
            extra.removeAll(schema.get(table).keySet());
            assertThat(extra).as("entity của bảng %s khai báo cột không có trong V1", table).isEmpty();
        }
    }

    @Test
    void javaTypesMatchSqlTypes() throws Exception {
        Map<String, Map<String, Class<?>>> entities = readEntityColumns();

        for (Map.Entry<String, Map<String, String>> tableEntry : readSchemaColumns().entrySet()) {
            String table = tableEntry.getKey();
            for (Map.Entry<String, String> columnEntry : tableEntry.getValue().entrySet()) {
                String column = columnEntry.getKey();
                String sqlType = columnEntry.getValue().split("\\(")[0];
                Class<?> javaType = entities.get(table).get(column);
                assertThat(javaType).as("{}.{} chưa được ánh xạ", table, column).isNotNull();

                List<Class<?>> allowed = SQL_TO_JAVA.stream()
                        .filter(entry -> entry.getKey().contains(sqlType))
                        .map(Map.Entry::getValue)
                        .toList();
                assertThat(allowed)
                        .as("kiểu SQL '%s' của {}.{} nằm ngoài bảng kiểu đã thống nhất", sqlType, table + "." + column)
                        .isNotEmpty()
                        .contains(javaType);
            }
        }
    }

    @Test
    void uniqueBusinessKeyIsDeclaredOnBothSides() throws Exception {
        String usersBlock = readMigrationText();
        assertThat(usersBlock)
                .as("V1 phải giữ email là duy nhất")
                .containsPattern("(?i)email\\s+VARCHAR\\(150\\)\\s+NOT\\s+NULL\\s+UNIQUE");

        Field email = findColumnField("users", "email");
        assertThat(email.getAnnotation(Column.class).unique())
                .as("User.email phải khai báo unique=true để Hibernate tạo đúng ràng buộc ở profile dev")
                .isTrue();
    }

    @Test
    void indexesDeclaredInMigrationAreAlsoDeclaredOnEntities() throws Exception {
        Map<String, Set<String>> expected = readSchemaIndexes();
        Map<String, Set<String>> actual = readEntityIndexes();

        assertThat(expected).hasSize(6);
        assertThat(expected.values().stream().mapToInt(Set::size).sum())
                .as("V1 phải khai báo 10 index hiệu năng")
                .isEqualTo(10);
        assertThat(actual.keySet()).containsExactlyInAnyOrderElementsOf(expected.keySet());
        for (String table : new TreeSet<>(expected.keySet())) {
            assertThat(actual.get(table))
                    .as("index của bảng %s phải khớp tên và cột với V1", table)
                    .containsExactlyInAnyOrderElementsOf(expected.get(table));
        }
    }

    private static final Pattern CREATE_INDEX =
            Pattern.compile("^INDEX\\s+(\\w+)\\s*\\(([^)]*)\\)$");

    private Map<String, Set<String>> readSchemaIndexes() throws Exception {
        Map<String, Set<String>> indexes = new LinkedHashMap<>();
        Matcher tablesMatcher = CREATE_TABLE.matcher(readMigrationText());
        while (tablesMatcher.find()) {
            String table = tablesMatcher.group(1).toLowerCase();
            Set<String> names = new TreeSet<>();
            for (String rawLine : tablesMatcher.group(2).split("\n")) {
                Matcher line = CREATE_INDEX.matcher(rawLine.trim().replaceAll(",\\s*$", ""));
                if (line.matches()) {
                    names.add(line.group(1) + "(" + normalizeColumns(line.group(2)) + ")");
                }
            }
            indexes.put(table, names);
        }
        indexes.values().removeIf(Set::isEmpty);
        return indexes;
    }

    private Map<String, Set<String>> readEntityIndexes() {
        Map<String, Set<String>> indexes = new LinkedHashMap<>();
        for (var managedType : entityManagerFactory.getMetamodel().getManagedTypes()) {
            Class<?> javaType = managedType.getJavaType();
            Table table = javaType == null ? null : javaType.getAnnotation(Table.class);
            if (table == null || table.indexes().length == 0) {
                continue;
            }
            Set<String> names = new TreeSet<>();
            for (jakarta.persistence.Index index : table.indexes()) {
                assertThat(index.name()).as("index trên %s phải đặt tên giống V1", table.name()).isNotEmpty();
                names.add(index.name() + "(" + normalizeColumns(index.columnList()) + ")");
            }
            indexes.put(table.name().toLowerCase(), names);
        }
        return indexes;
    }

    private static String normalizeColumns(String columns) {
        return java.util.Arrays.stream(columns.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .reduce((left, right) -> left + "," + right)
                .orElse("");
    }

    private static final List<Map.Entry<Set<String>, Class<?>>> SQL_TO_JAVA = List.of(
            Map.entry(Set.of("VARCHAR", "TEXT"), String.class),
            Map.entry(Set.of("BIGINT"), Long.class),
            Map.entry(Set.of("INT"), Integer.class),
            Map.entry(Set.of("DECIMAL"), BigDecimal.class),
            Map.entry(Set.of("DATETIME", "TIMESTAMP"), LocalDateTime.class),
            Map.entry(Set.of("DATE"), LocalDate.class));

    private Field findColumnField(String tableName, String columnName) {
        for (var managedType : entityManagerFactory.getMetamodel().getManagedTypes()) {
            Class<?> javaType = managedType.getJavaType();
            Table table = javaType == null ? null : javaType.getAnnotation(Table.class);
            if (table == null || !table.name().equalsIgnoreCase(tableName)) {
                continue;
            }
            for (Class<?> c = javaType; c != Object.class; c = c.getSuperclass()) {
                for (Field field : c.getDeclaredFields()) {
                    Column column = field.getAnnotation(Column.class);
                    String mapped = column != null && !column.name().isEmpty()
                            ? column.name()
                            : toSnake(field.getName());
                    if (mapped.equalsIgnoreCase(columnName)) {
                        return field;
                    }
                }
            }
        }
        throw new AssertionError("không thấy cột " + tableName + "." + columnName + " trong các entity");
    }

    private Map<String, Map<String, String>> readSchemaColumns() throws Exception {
        Map<String, Map<String, String>> tables = new LinkedHashMap<>();
        Matcher tablesMatcher = CREATE_TABLE.matcher(readMigrationText());
        while (tablesMatcher.find()) {
            Map<String, String> columns = new LinkedHashMap<>();
            for (String rawLine : tablesMatcher.group(2).split("\n")) {
                String line = rawLine.trim().replaceAll(",\\s*$", "");
                if (line.isEmpty() || NOT_A_COLUMN.contains(line.split("\\s+")[0].toUpperCase())) {
                    continue;
                }
                String[] parts = line.split("\\s+");
                columns.put(parts[0].toLowerCase(), parts[1].toUpperCase());
            }
            tables.put(tablesMatcher.group(1).toLowerCase(), columns);
        }
        assertThat(tables).as("V1 phải khai báo 6 bảng").hasSize(6);
        return tables;
    }

    private Map<String, Map<String, Class<?>>> readEntityColumns() {
        Map<String, Map<String, Class<?>>> tables = new LinkedHashMap<>();
        for (var managedType : entityManagerFactory.getMetamodel().getManagedTypes()) {
            Class<?> javaType = managedType.getJavaType();
            if (javaType == null || javaType.getAnnotation(Entity.class) == null) {
                continue;
            }
            Table tableAnnotation = javaType.getAnnotation(Table.class);
            String tableName = tableAnnotation != null && !tableAnnotation.name().isEmpty()
                    ? tableAnnotation.name().toLowerCase()
                    : toSnake(javaType.getSimpleName());

            Map<String, Class<?>> columns = new LinkedHashMap<>();
            for (Class<?> c = javaType; c != Object.class; c = c.getSuperclass()) {
                for (Field field : c.getDeclaredFields()) {
                    if (field.isAnnotationPresent(Transient.class) || Modifier.isStatic(field.getModifiers())) {
                        continue;
                    }
                    if (field.isAnnotationPresent(ManyToOne.class)) {
                        JoinColumn join = field.getAnnotation(JoinColumn.class);
                        columns.put(join != null ? join.name().toLowerCase() : toSnake(field.getName()) + "_id", Long.class);
                        continue;
                    }
                    Column column = field.getAnnotation(Column.class);
                    String name = column != null && !column.name().isEmpty()
                            ? column.name().toLowerCase()
                            : toSnake(field.getName());
                    columns.put(name, javaTypeOf(field));
                }
            }
            tables.put(tableName, columns);
        }
        return tables;
    }

    private Class<?> javaTypeOf(Field field) {
        Enumerated enumerated = field.getAnnotation(Enumerated.class);
        if (enumerated != null && enumerated.value() == EnumType.STRING) {
            return String.class;
        }
        return field.getType();
    }

    private static String toSnake(String name) {
        return name.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase();
    }

    private String readMigrationText() throws Exception {
        try (InputStream in = getClass().getResourceAsStream(MIGRATION)) {
            assertThat(in).as("không tìm thấy " + MIGRATION + " trên classpath").isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
