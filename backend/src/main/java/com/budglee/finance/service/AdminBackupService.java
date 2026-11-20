package com.budglee.finance.service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminBackupService {
    private static final Pattern NAME = Pattern.compile("budglee_backup_[0-9]{8}_[0-9]{6}\\.sql\\.gz");
    private static final String CONFIRMATION = "RESTORE BUDGLEE DATABASE";
    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private final Map<String, Instant> confirmations = new ConcurrentHashMap<>();

    @Autowired(required = false)
    private DataSource dataSource;

    @Value("${app.admin.backup-directory:/backups}") private String backupDirectory;
    @Value("${app.admin.backup-script:./devops/scripts/backup.sh}") private String backupScript;
    @Value("${app.admin.restore-script:./devops/scripts/restore.sh}") private String restoreScript;
    @Value("${spring.datasource.url:}") private String datasourceUrl;
    @Value("${spring.datasource.username:}") private String datasourceUsername;
    @Value("${spring.datasource.password:}") private String datasourcePassword;

    public List<BackupFile> list() {
        Path dir = Path.of(backupDirectory);
        if (!Files.isDirectory(dir)) return List.of();
        try (Stream<Path> paths = Files.list(dir)) {
            return paths.filter(Files::isRegularFile).filter(path -> NAME.matcher(path.getFileName().toString()).matches())
                    .map(this::toBackupFile).sorted(Comparator.comparing(BackupFile::getCreatedAt).reversed()).toList();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể đọc danh sách bản backup");
        }
    }

    public synchronized BackupFile create() {
        try {
            run(List.of("bash", backupScript), "Không thể tạo backup");
        } catch (ResponseStatusException ex) {
            if (dataSource != null) {
                log.warn("Script backup.sh lỗi ({}), chuyển sang sao lưu trực tiếp qua JDBC DataSource", ex.getReason());
                createViaJdbc();
            } else {
                throw ex;
            }
        }
        return list().stream().findFirst().orElseThrow(() ->
                new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Script chạy xong nhưng không tìm thấy file backup"));
    }

    public RestoreChallenge prepareRestore(String backupName) {
        Path file = requireBackup(backupName);
        Instant now = Instant.now();
        confirmations.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
        String token = UUID.randomUUID().toString();
        confirmations.put(token, now.plusSeconds(300));
        return new RestoreChallenge(token, file.getFileName().toString(), CONFIRMATION, 300);
    }

    public synchronized void restore(String backupName, String token, String confirmation) {
        Instant expires = token == null ? null : confirmations.remove(token);
        if (expires == null || expires.isBefore(Instant.now()) || !CONFIRMATION.equals(confirmation)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Xác nhận restore không hợp lệ hoặc đã hết hạn; hãy bắt đầu lại");
        }
        Path file = requireBackup(backupName);
        try {
            run(List.of("bash", restoreScript, file.toAbsolutePath().toString()), "Khôi phục backup thất bại");
        } catch (ResponseStatusException ex) {
            if (dataSource != null) {
                log.warn("Script restore.sh lỗi ({}), chuyển sang khôi phục trực tiếp qua JDBC DataSource", ex.getReason());
                restoreViaJdbc(file);
            } else {
                throw ex;
            }
        }
    }

    private void createViaJdbc() {
        try {
            Path dir = Path.of(backupDirectory);
            Files.createDirectories(dir);
            String filename = "budglee_backup_" + LocalDateTime.now().format(TS_FMT) + ".sql.gz";
            Path target = dir.resolve(filename);

            try (Connection conn = dataSource.getConnection();
                 PrintWriter out = new PrintWriter(new OutputStreamWriter(new GZIPOutputStream(Files.newOutputStream(target)), StandardCharsets.UTF_8))) {
                out.println("-- Budglee JDBC Database Backup");
                out.println("SET FOREIGN_KEY_CHECKS=0;");

                DatabaseMetaData meta = conn.getMetaData();
                String catalog = conn.getCatalog();
                List<String> tables = new ArrayList<>();
                try (ResultSet rs = meta.getTables(catalog, null, "%", new String[]{"TABLE"})) {
                    while (rs.next()) {
                        String tableName = rs.getString("TABLE_NAME");
                        if (tableName != null && !tableName.equalsIgnoreCase("flyway_schema_history")) {
                            tables.add(tableName);
                        }
                    }
                }

                for (String table : tables) {
                    try (Statement st = conn.createStatement();
                         ResultSet rs = st.executeQuery("SELECT * FROM `" + table + "`")) {
                        ResultSetMetaData rsMeta = rs.getMetaData();
                        int colCount = rsMeta.getColumnCount();
                        while (rs.next()) {
                            StringBuilder sb = new StringBuilder("REPLACE INTO `").append(table).append("` (");
                            for (int i = 1; i <= colCount; i++) {
                                if (i > 1) sb.append(", ");
                                sb.append("`").append(rsMeta.getColumnName(i)).append("`");
                            }
                            sb.append(") VALUES (");
                            for (int i = 1; i <= colCount; i++) {
                                if (i > 1) sb.append(", ");
                                Object val = rs.getObject(i);
                                if (val == null) {
                                    sb.append("NULL");
                                } else if (val instanceof Number) {
                                    sb.append(val);
                                } else if (val instanceof Boolean b) {
                                    sb.append(b ? 1 : 0);
                                } else {
                                    String escaped = val.toString()
                                            .replace("\\", "\\\\")
                                            .replace("'", "\\'")
                                            .replace("\r", "\\r")
                                            .replace("\n", "\\n");
                                    sb.append("'").append(escaped).append("'");
                                }
                            }
                            sb.append(");");
                            out.println(sb);
                        }
                    }
                }
                out.println("SET FOREIGN_KEY_CHECKS=1;");
            }

            List<BackupFile> all = list();
            if (all.size() > 7) {
                for (BackupFile old : all.subList(7, all.size())) {
                    Files.deleteIfExists(dir.resolve(old.getName()));
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo backup qua JDBC: " + e.getMessage());
        }
    }

    private void restoreViaJdbc(Path file) {
        try (Connection conn = dataSource.getConnection();
             Statement st = conn.createStatement();
             BufferedReader reader = new BufferedReader(new InputStreamReader(new GZIPInputStream(Files.newInputStream(file)), StandardCharsets.UTF_8))) {
            StringBuilder currentSql = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("--") || trimmed.startsWith("/*")) {
                    continue;
                }
                if (trimmed.toUpperCase().startsWith("CREATE DATABASE") || trimmed.toUpperCase().startsWith("USE ")) {
                    continue;
                }
                currentSql.append(line).append("\n");
                if (trimmed.endsWith(";")) {
                    String sql = currentSql.toString().trim();
                    if (!sql.isEmpty()) {
                        st.execute(sql);
                    }
                    currentSql.setLength(0);
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Khôi phục backup qua JDBC thất bại: " + e.getMessage());
        }
    }

    private Path requireBackup(String name) {
        if (name == null || !NAME.matcher(name).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên file backup không hợp lệ");
        }
        Path dir = Path.of(backupDirectory).toAbsolutePath().normalize();
        Path file = dir.resolve(name).normalize();
        if (!file.getParent().equals(dir) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bản backup");
        }
        return file;
    }

    private void run(List<String> command, String failure) {
        try {
            ProcessBuilder builder = new ProcessBuilder(command).redirectErrorStream(true);
            configureDatabaseEnvironment(builder);
            Process process = builder.start();
            if (!process.waitFor(10, TimeUnit.MINUTES)) {
                process.destroyForcibly();
                throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "Tác vụ backup/restore quá thời gian");
            }
            byte[] output = process.getInputStream().readAllBytes();
            if (process.exitValue() != 0) {
                String detail = new String(output, java.nio.charset.StandardCharsets.UTF_8);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, failure + ": " + detail);
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, failure + ": không chạy được script");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, failure + ": tiến trình bị gián đoạn");
        }
    }

    private void configureDatabaseEnvironment(ProcessBuilder builder) {
        Map<String, String> environment = builder.environment();
        environment.putIfAbsent("BACKUP_DIR", backupDirectory);
        if (!environment.containsKey("DB_PASSWORD") && !datasourcePassword.isBlank()) environment.put("DB_PASSWORD", datasourcePassword);
        if (!environment.containsKey("DB_USER") && !datasourceUsername.isBlank()) environment.put("DB_USER", datasourceUsername);
        if (datasourceUrl.startsWith("jdbc:mysql://")) {
            try {
                URI uri = URI.create(datasourceUrl.substring("jdbc:".length()));
                environment.putIfAbsent("DB_HOST", uri.getHost());
                environment.putIfAbsent("DB_PORT", Integer.toString(uri.getPort() > 0 ? uri.getPort() : 3306));
                String dbName = uri.getPath() == null ? "" : uri.getPath().replaceFirst("^/", "");
                if (!dbName.isBlank()) environment.putIfAbsent("DB_NAME", dbName);
            } catch (IllegalArgumentException ignored) {
                // Invalid JDBC configuration is reported by the invoked backup/restore client.
            }
        }
    }

    private BackupFile toBackupFile(Path path) {
        try {
            return new BackupFile(path.getFileName().toString(), Files.size(path), Files.getLastModifiedTime(path).toInstant());
        } catch (IOException exception) {
            throw new IllegalStateException("Không đọc được metadata backup", exception);
        }
    }

    @Data
    public static class BackupFile {
        private final String name;
        private final long sizeBytes;
        private final Instant createdAt;
    }

    @Data
    @RequiredArgsConstructor
    public static class RestoreChallenge {
        private final String token;
        private final String backupName;
        private final String requiredConfirmation;
        private final long expiresInSeconds;
    }
}
