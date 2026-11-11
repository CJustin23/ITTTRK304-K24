package com.budglee.finance;

import com.budglee.finance.service.AdminBackupService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AdminBackupServiceTest {
    @TempDir Path directory;

    private AdminBackupService service() {
        AdminBackupService service = new AdminBackupService();
        ReflectionTestUtils.setField(service, "backupDirectory", directory.toString());
        ReflectionTestUtils.setField(service, "restoreScript", directory.resolve("no-restore-script").toString());
        return service;
    }

    @Test
    void listsOnlyRealBackupFilesAndPreparesOneTimeRestoreChallenge() throws Exception {
        String name = "budglee_backup_20261110_120000.sql.gz";
        Files.writeString(directory.resolve(name), "backup-bytes");
        Files.writeString(directory.resolve("notes.txt"), "not a backup");
        AdminBackupService service = service();

        assertThat(service.list()).extracting(AdminBackupService.BackupFile::getName).containsExactly(name);
        AdminBackupService.RestoreChallenge challenge = service.prepareRestore(name);
        assertThat(challenge.getBackupName()).isEqualTo(name);
        assertThat(challenge.getExpiresInSeconds()).isEqualTo(300);
        assertThatThrownBy(() -> service.restore(name, challenge.getToken(), "wrong phrase"))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.restore(name, challenge.getToken(), challenge.getRequiredConfirmation()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("không hợp lệ hoặc đã hết hạn");
    }

    @Test
    void rejectsBackupPathTraversal() {
        assertThatThrownBy(() -> service().prepareRestore("..\\secrets.sql.gz"))
                .isInstanceOf(ResponseStatusException.class);
    }
}
