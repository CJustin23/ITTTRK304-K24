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
 * DUAN-38: giữ ánh xạ JPA và Flyway (V1 khai báo bảng, V2 chuẩn hoá bề rộng + danh mục hệ thống,
 * V3 ENUM hoá các cột vai trò/loại/trạng thái) không lệch nhau.
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
            if (!schema.containsKey(table)) {
                continue;
            }

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
                        .<Class<?>>map(Map.Entry::getValue)
                        .toList();
                assertThat(allowed)
                        .as("kiểu SQL '%s' của {}.{} nằm ngoài bảng kiểu đã thống nhất", sqlType, table + "." + column)
                        .isNotEmpty();
                assertThat(allowed.contains(javaType))
                        .as("kiểu SQL '%s' của {}.{} nằm ngoài bảng kiểu đã thống nhất", sqlType, table + "." + column)
                        .isTrue();
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
        assertThat(actual.keySet()).containsAll(expected.keySet());
        for (String table : new TreeSet<>(expected.keySet())) {
            assertThat(actual.get(table))
                    .as("index của bảng %s phải khớp tên và cột với V1", table)
                    .containsExactlyInAnyOrderElementsOf(expected.get(table));
        }
    }

    private static final Pattern CREATE_INDEX =
            Pattern.compile("^INDEX\\s+(\\w+)\\s*\\(([^)]*)\\)$");

    private static final String V2_MIGRATION = "/db/migration/V2__normalize_schema_and_seed_categories.sql";
    private static final String V3_MIGRATION = "/db/migration/V3__restore_enum_column_types.sql";

    /** V3: ALTER TABLE x MODIFY COLUMN y ENUM('A', 'B') — danh sách giá trị phải khớp đúng enum Java. */
    private static final Pattern V3_ENUM =
            Pattern.compile("ALTER TABLE (\\w+)\\s+MODIFY COLUMN (\\w+)\\s+ENUM\\(([^)]*)\\)", Pattern.DOTALL);

    /** V2: ALTER TABLE x MODIFY COLUMN y VARCHAR(n) — bề rộng phải đúng khai báo của entity. */
    private static final Pattern V2_VARCHAR =
            Pattern.compile("ALTER TABLE (\\w+)\\s+MODIFY COLUMN (\\w+)\\s+VARCHAR\\((\\d+)\\)", Pattern.DOTALL);

    @Test
    void enumValuesDeclaredInV3MatchTheJavaEnumConstants() throws Exception {
        String v3 = readMigrationText(V3_MIGRATION);
        Matcher matcher = V3_ENUM.matcher(v3);
        int checkedColumns = 0;

        while (matcher.find()) {
            String table = matcher.group(1).toLowerCase();
            String column = matcher.group(2).toLowerCase();
            List<String> sqlValues = splitEnumValues(matcher.group(3));

            Field field = findColumnField(table, column);
            Class<?> javaType = field.getType();
            assertThat(javaType.isEnum())
                    .as("{}.{} được V3 khai báo ENUM nhưng entity không phải enum", table, column)
                    .isTrue();

            List<String> javaValues = java.util.Arrays.stream(javaType.getEnumConstants())
                    .map(constant -> ((Enum<?>) constant).name())
                    .toList();
            assertThat(javaValues)
                    .as("V3 và %s lệch nhau ở {}.{} — MySQL sẽ từ chối ghi giá trị không có trong ENUM",
                            javaType.getSimpleName(), table, column)
                    .containsExactlyInAnyOrderElementsOf(sqlValues);
            checkedColumns++;
        }

        assertThat(checkedColumns).as("V3 phải ENUM hoá 5 cột vai trò/loại/trạng thái").isEqualTo(5);
    }

    @Test
    void everyStringEnumColumnIsCoveredByV3() throws Exception {
        Map<String, Set<String>> declared = new LinkedHashMap<>();
        Matcher matcher = V3_ENUM.matcher(readMigrationText(V3_MIGRATION));
        while (matcher.find()) {
            declared.computeIfAbsent(matcher.group(1).toLowerCase(), key -> new TreeSet<>())
                    .add(matcher.group(2).toLowerCase());
        }

        for (Map.Entry<String, Set<String>> entry : enumColumnsOfEntities().entrySet()) {
            String table = entry.getKey();
            if (!declared.containsKey(table)) {
                continue;
            }
            Set<String> missing = new TreeSet<>(entry.getValue());
            missing.removeAll(declared.getOrDefault(table, Set.of()));
            assertThat(missing)
                    .as("bảng %s có cột enum mới nhưng V3 chưa bổ sung ENUM — profile validate sẽ vỡ lúc deploy", table)
                    .isEmpty();
        }
    }

    @Test
    void enumColumnsKeepTheWidthAndLengthDeclaredInV2() throws Exception {
        Map<String, Integer> widths = new LinkedHashMap<>();
        Matcher matcher = V2_VARCHAR.matcher(readMigrationText(V2_MIGRATION));
        while (matcher.find()) {
            widths.put(matcher.group(1).toLowerCase() + "." + matcher.group(2).toLowerCase(),
                    Integer.parseInt(matcher.group(3)));
        }

        assertThat(widths).as("V2 phải khai báo lại bề rộng cho 5 cột enum").hasSize(5);

        for (Map.Entry<String, Set<String>> tableEntry : enumColumnsOfEntities().entrySet()) {
            for (String column : tableEntry.getValue()) {
                String key = tableEntry.getKey() + "." + column;
                if (!widths.containsKey(key)) {
                    continue;
                }
                Field field = findColumnField(tableEntry.getKey(), column);
                int width = widths.get(key);
                assertThat(field.getAnnotation(Column.class).length())
                        .as("entity khai báo length khác VARCHAR của V2 ở %s.%s", tableEntry.getKey(), column)
                        .isEqualTo(width);

                int longest = java.util.Arrays.stream(field.getType().getEnumConstants())
                        .map(constant -> ((Enum<?>) constant).name().length())
                        .mapToInt(Integer::intValue)
                        .max()
                        .orElse(0);
                assertThat(longest)
                        .as("giá trị enum dài nhất của %s.%s tràn quá VARCHAR(%d)", tableEntry.getKey(), column, width)
                        .isLessThanOrEqualTo(width);
            }
        }
    }

    private Map<String, Set<String>> enumColumnsOfEntities() {
        Map<String, Set<String>> columns = new LinkedHashMap<>();
        for (var managedType : entityManagerFactory.getMetamodel().getManagedTypes()) {
            Class<?> javaType = managedType.getJavaType();
            Table table = javaType == null ? null : javaType.getAnnotation(Table.class);
            if (table == null) {
                continue;
            }
            for (Class<?> c = javaType; c != Object.class; c = c.getSuperclass()) {
                for (Field field : c.getDeclaredFields()) {
                    Enumerated enumerated = field.getAnnotation(Enumerated.class);
                    if (enumerated == null || enumerated.value() != EnumType.STRING) {
                        continue;
                    }
                    Column column = field.getAnnotation(Column.class);
                    String name = column != null && !column.name().isEmpty()
                            ? column.name().toLowerCase()
                            : toSnake(field.getName());
                    columns.computeIfAbsent(table.name().toLowerCase(), key -> new TreeSet<>()).add(name);
                }
            }
        }
        return columns;
    }

    private static List<String> splitEnumValues(String rawValues) {
        return java.util.Arrays.stream(rawValues.split(","))
                .map(String::trim)
                .map(value -> value.replaceAll("^'|'$", ""))
                .filter(value -> !value.isEmpty())
                .toList();
    }

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
        return readMigrationText(MIGRATION);
    }

    private String readMigrationText(String location) throws Exception {
        try (InputStream in = getClass().getResourceAsStream(location)) {
            assertThat(in).as("không tìm thấy " + location + " trên classpath").isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
