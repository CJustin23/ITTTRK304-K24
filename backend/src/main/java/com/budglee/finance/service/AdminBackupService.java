package com.budglee.finance.service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.net.URI;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service @RequiredArgsConstructor
public class AdminBackupService {
    private static final Pattern NAME = Pattern.compile("budglee_backup_[0-9]{8}_[0-9]{6}\\.sql\\.gz");
    private static final String CONFIRMATION = "RESTORE BUDGLEE DATABASE";
    private final Map<String, Instant> confirmations = new ConcurrentHashMap<>();

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
        run(List.of("bash", backupScript), "Không thể tạo backup");
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
        run(List.of("bash", restoreScript, file.getFileName().toString()), "Khôi phục backup thất bại");
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
