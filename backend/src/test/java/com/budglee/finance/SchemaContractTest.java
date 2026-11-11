package com.budglee.finance;

import jakarta.persistence.Column;
import com.budglee.finance.entity.ChatbotApiKey;
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
 * DUAN-38: giữ ánh xạ JPA và Flyway không lệch nhau trên toàn bộ migration đang có —
 * V1 (6 bảng cốt lõi), V2 (chuẩn hoá bề rộng + danh mục hệ thống), V3 (ENUM hoá cột vai trò/loại),
 * V4 (nhóm hộ), V5 (lời mời tham gia nhóm), V12 (khoa phien ban cua vi), V13 (trang thai tai khoan).
 * Tú định nghĩa bảng bằng SQL, cả nhóm định nghĩa entity bằng annotation. Hai nguồn lệch nhau thì
 * profile prod (ddl-auto: validate) không khởi động được, và lỗi chỉ lộ ra lúc deploy.
 */
@SpringBootTest
@ActiveProfiles("test")
class SchemaContractTest {

    private static final String MIGRATION = "/db/migration/V1__init_schema.sql";

    /**
     * Các file khai cấu trúc: V1 bảng cốt lõi, V4 nhóm hộ, V5 lời mời, V8 cột liên kết chuyển ví,
     * V12 khoa phien ban cua vi, V13 cot trang thai tai khoan.
     */
    private static final List<String> SCHEMA_MIGRATIONS = List.of(
            MIGRATION,
            "/db/migration/V4__create_family_groups.sql",
            "/db/migration/V5__create_family_invitations.sql",
            "/db/migration/V8__link_transfer_transactions.sql",
            "/db/migration/V11__add_transaction_lookup_indexes.sql",
            "/db/migration/V12__add_wallet_version.sql",
            "/db/migration/V13__add_user_enabled_flag.sql",
            "/db/migration/V15__create_chatbot_api_keys.sql",
            "/db/migration/V16__optimize_reporting_indexes.sql");

    /** ALTER TABLE x ADD COLUMN y VARCHAR(n) — bản V8 thêm cột vào bảng đã có. */
    private static final Pattern ADD_COLUMN = Pattern.compile(
            "ALTER TABLE (\\w+)\\s+ADD COLUMN (\\w+)\\s+(VARCHAR|INT|BIGINT|DECIMAL|TIMESTAMP|DATETIME|DATE|TEXT|BOOLEAN|ENUM)\\b(\\s*\\([^)]*\\))?",
            Pattern.CASE_INSENSITIVE);

    /** CREATE INDEX t ON x (cot) — cách V8 khai index mà vẫn chạy được trên H2. */
    private static final Pattern CREATE_INDEX_ON = Pattern.compile(
            "CREATE INDEX (\\w+)\\s+ON (\\w+)\\s*\\(([^)]*)\\)", Pattern.CASE_INSENSITIVE);

    private static final Pattern CREATE_TABLE =
            Pattern.compile("CREATE TABLE (?:IF NOT EXISTS )?(\\w+)\\s*\\((.*?)\\n\\)", Pattern.DOTALL);

    /** Chỉ dòng nào có tên cột đứng trước một kiểu SQL thật sự mới là cột; CONSTRAINT/CHECK/INDEX/REFERENCES bị loại. */
    private static final Pattern COLUMN_LINE = Pattern.compile(
            "^([A-Za-z_][A-Za-z0-9_]*)\\s+(VARCHAR|INT|BIGINT|DECIMAL|TIMESTAMP|DATETIME|DATE|TEXT|BOOLEAN|ENUM)\\b(\\s*\\([^)]*\\))?",
            Pattern.CASE_INSENSITIVE);

    @Test
    void chatbotApiKeyMigrationMatchesEncryptedEntityTable() throws Exception {
        String migration;
        try (InputStream stream = getClass().getResourceAsStream("/db/migration/V15__create_chatbot_api_keys.sql")) {
            assertThat(stream).isNotNull();
            migration = new String(stream.readAllBytes(), StandardCharsets.UTF_8).toLowerCase();
        }
        assertThat(ChatbotApiKey.class.getAnnotation(Table.class).name()).isEqualTo("chatbot_api_keys");
        assertThat(migration).contains("create table chatbot_api_keys", "key_ciphertext text not null",
                "key_masked varchar(120) not null", "active boolean not null");
    }

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
            assertThat(missing).as("bảng %s có cột trong migration nhưng entity không ánh xạ", table).isEmpty();
        }
    }

    @Test
    void entitiesDoNotInventColumnsMissingFromMigration() throws Exception {
        Map<String, Map<String, String>> schema = readSchemaColumns();

        for (Map.Entry<String, Map<String, Class<?>>> entityEntry : readEntityColumns().entrySet()) {
            String table = entityEntry.getKey();
            assertThat(schema.keySet())
                    .as("entity %s trỏ tới bảng không có trong V1/V4/V5 nào", table)
                    .contains(table);

            Set<String> extra = new TreeSet<>(entityEntry.getValue().keySet());
            extra.removeAll(schema.get(table).keySet());
            assertThat(extra).as("entity của bảng %s khai báo cột không có trong migration", table).isEmpty();
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

        assertThat(expected).hasSize(8);
        assertThat(expected.values().stream().mapToInt(Set::size).sum())
                .as("V1 khai 10 index, V5 thêm 3, V8 thêm 1, V11 thêm 2, V15 thêm 1, V16 thêm 1 index")
                .isEqualTo(18);
        assertThat(actual.keySet()).containsExactlyInAnyOrderElementsOf(expected.keySet());
        for (String table : new TreeSet<>(expected.keySet())) {
            assertThat(actual.get(table))
                    .as("index của bảng %s phải khớp tên và cột với migration", table)
                    .containsExactlyInAnyOrderElementsOf(expected.get(table));
        }
    }

    private static final Pattern CREATE_INDEX =
            Pattern.compile("INDEX\\s+(\\w+)\\s*\\(\\s*([^)]*?)\\s*\\)", Pattern.DOTALL);

    private static final String V3_MIGRATION = "/db/migration/V3__restore_enum_column_types.sql";

    /** V3: ALTER TABLE x MODIFY COLUMN y ENUM('A', 'B'). */
    private static final Pattern V3_ENUM =
            Pattern.compile("ALTER TABLE (\\w+)\\s+MODIFY COLUMN (\\w+)\\s+ENUM\\(([^)]*)\\)", Pattern.DOTALL);

    /** V5: CHECK (status IN ('PENDING', 'ACCEPTED')) khai ngay trong CREATE TABLE. */
    private static final Pattern CHECK_IN =
            Pattern.compile("CHECK\\s*\\(\\s*(\\w+)\\s+IN\\s*\\((.*?)\\)\\s*\\)", Pattern.DOTALL);

    private static final Pattern VARCHAR_WIDTH = Pattern.compile("\\((\\d+)");

    @Test
    void everyEnumValueListInSqlMatchesTheJavaEnumConstants() throws Exception {
        Map<String, List<String>> allowed = readEnumAllowedValues();

        assertThat(allowed.keySet())
                .as("V3 ENUM hoá 5 cột và V5 buộc CHECK cho status của lời mời")
                .hasSize(6);

        for (Map.Entry<String, List<String>> entry : allowed.entrySet()) {
            String[] parts = entry.getKey().split("\\.");
            Field field = findColumnField(parts[0], parts[1]);
            Class<?> javaType = field.getType();
            assertThat(javaType.isEnum())
                    .as("{}.{} bị ràng buộc giá trị trong SQL nhưng entity không phải enum", parts[0], parts[1])
                    .isTrue();

            List<String> javaValues = java.util.Arrays.stream(javaType.getEnumConstants())
                    .map(constant -> ((Enum<?>) constant).name())
                    .toList();
            assertThat(javaValues)
                    .as("SQL và %s lệch nhau ở {}.{} — MySQL sẽ từ chối ghi giá trị không có trong danh sách",
                            javaType.getSimpleName(), parts[0], parts[1])
                    .containsExactlyInAnyOrderElementsOf(entry.getValue());
        }
    }

    @Test
    void everyStringEnumColumnIsConstrainedInSql() throws Exception {
        Map<String, List<String>> allowed = readEnumAllowedValues();

        for (Map.Entry<String, Set<String>> entry : enumColumnsOfEntities().entrySet()) {
            Set<String> missing = new TreeSet<>(entry.getValue());
            missing.removeIf(column -> allowed.containsKey(entry.getKey() + "." + column));
            assertThat(missing)
                    .as("bảng %s có cột enum mới nhưng chưa migration nào ràng buộc giá trị — "
                            + "profile validate sẽ vỡ lúc deploy", entry.getKey())
                    .isEmpty();
        }
    }

    @Test
    void enumColumnsKeepTheWidthDeclaredInMigration() throws Exception {
        Map<String, Map<String, String>> schema = readSchemaColumns();

        for (Map.Entry<String, Set<String>> tableEntry : enumColumnsOfEntities().entrySet()) {
            for (String column : tableEntry.getValue()) {
                Field field = findColumnField(tableEntry.getKey(), column);
                String sqlType = schema.get(tableEntry.getKey()).get(column);
                assertThat(sqlType)
                        .as("%s.%s không được khai báo trong migration nào", tableEntry.getKey(), column)
                        .isNotNull();

                Matcher width = VARCHAR_WIDTH.matcher(sqlType);
                assertThat(width.find())
                        .as("%s.%s phải là VARCHAR(n) để chứa giá trị enum", tableEntry.getKey(), column)
                        .isTrue();
                int declared = Integer.parseInt(width.group(1));

                assertThat(field.getAnnotation(Column.class).length())
                        .as("entity khai báo length khác VARCHAR(%d) của migration ở %s.%s",
                                declared, tableEntry.getKey(), column)
                        .isEqualTo(declared);

                int longest = java.util.Arrays.stream(field.getType().getEnumConstants())
                        .map(constant -> ((Enum<?>) constant).name().length())
                        .mapToInt(Integer::intValue)
                        .max()
                        .orElse(0);
                assertThat(longest)
                        .as("giá trị enum dài nhất của %s.%s tràn quá VARCHAR(%d)",
                                tableEntry.getKey(), column, declared)
                        .isLessThanOrEqualTo(declared);
            }
        }
    }

    /**
     * Giá trị hợp lệ của một cột enum lấy từ hai cách khai báo mà nhóm đang dùng: ENUM(...) ở V3
     * và CHECK (cot IN (...)) ở V5. Bảng nào cũng phải được ràng buộc, không được bỏ trống.
     */
    private Map<String, List<String>> readEnumAllowedValues() throws Exception {
        Map<String, List<String>> allowed = new LinkedHashMap<>();

        Matcher enumerated = V3_ENUM.matcher(readMigrationText(V3_MIGRATION));
        while (enumerated.find()) {
            allowed.put(enumerated.group(1).toLowerCase() + "." + enumerated.group(2).toLowerCase(),
                    splitEnumValues(enumerated.group(3)));
        }

        for (String location : SCHEMA_MIGRATIONS) {
            Matcher tables = CREATE_TABLE.matcher(readMigrationText(location));
            while (tables.find()) {
                String table = tables.group(1).toLowerCase();
                Matcher checks = CHECK_IN.matcher(tables.group(2));
                while (checks.find()) {
                    allowed.put(table + "." + checks.group(1).toLowerCase(), splitEnumValues(checks.group(2)));
                }
            }
        }
        return allowed;
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
        for (String location : SCHEMA_MIGRATIONS) {
            Matcher tablesMatcher = CREATE_TABLE.matcher(readMigrationText(location));
            while (tablesMatcher.find()) {
                String table = tablesMatcher.group(1).toLowerCase();
                Set<String> names = new TreeSet<>();
                Matcher line = CREATE_INDEX.matcher(tablesMatcher.group(2));
                while (line.find()) {
                    names.add(line.group(1) + "(" + normalizeColumns(line.group(2)) + ")");
                }
                indexes.put(table, names);
            }
            Matcher standalone = CREATE_INDEX_ON.matcher(readMigrationText(location));
            while (standalone.find()) {
                indexes.computeIfAbsent(standalone.group(2).toLowerCase(), key -> new TreeSet<>())
                        .add(standalone.group(1) + "(" + normalizeColumns(standalone.group(3)) + ")");
            }
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
            Map.entry(Set.of("BOOLEAN"), Boolean.class),
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
        for (String location : SCHEMA_MIGRATIONS) {
            Matcher tablesMatcher = CREATE_TABLE.matcher(readMigrationText(location));
            while (tablesMatcher.find()) {
                Map<String, String> columns = new LinkedHashMap<>();
                for (String rawLine : tablesMatcher.group(2).split("\n")) {
                    Matcher line = COLUMN_LINE.matcher(rawLine.trim().replaceAll(",\\s*$", ""));
                    // find() với pattern có ^ = so khớp từ đầu dòng; matches() sẽ bắt chuỗi hết ở (n) nên trượt mọi cột
                    if (!line.find()) {
                        continue;
                    }
                    String type = line.group(2).toUpperCase();
                    String size = line.group(3) == null ? "" : line.group(3).trim().toUpperCase();
                    columns.put(line.group(1).toLowerCase(), type + size);
                }
                tables.put(tablesMatcher.group(1).toLowerCase(), columns);
            }

            Matcher altered = ADD_COLUMN.matcher(readMigrationText(location));
            while (altered.find()) {
                Map<String, String> columns = tables.get(altered.group(1).toLowerCase());
                if (columns != null) {
                    columns.put(altered.group(2).toLowerCase(), altered.group(3).toUpperCase()
                            + (altered.group(4) == null ? "" : altered.group(4).trim().toUpperCase()));
                }
            }
        }
        assertThat(tables)
                .as("V1 + V4 + V5 phải khai báo 8 bảng (6 cốt lõi + family_groups + family_invitations)")
                .hasSize(9);
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
