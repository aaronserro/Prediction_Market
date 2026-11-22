package com.betting.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import com.betting.backend.user.dto.UserCreateRequest;
import com.betting.backend.user.dto.UserResponse;

class UserControllerTest {

    private UserRepository users;
    private AdminUserCreationService creationService;
    private UserLifecycleService lifecycleService;
    private UserController controller;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        creationService = mock(AdminUserCreationService.class);
        lifecycleService = mock(UserLifecycleService.class);
        controller = new UserController(
                users,
            creationService,
                lifecycleService);
    }

        @Test
        void createDelegatesAndPreservesResponseContract() {
        User administrator = user(1L, "admin", true);
        UserCreateRequest request = new UserCreateRequest();
        request.setUsername("alice");
        request.setEmail("alice@example.com");
        request.setPassword("long-password");
        request.setRoles(Set.of("ROLE_USER"));
        User saved = user(42L, "alice", true);
        saved.setRoles(Set.of("ROLE_USER"));
        when(creationService.create(request, administrator)).thenReturn(saved);

        var response = controller.createUser(request, administrator);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getCacheControl())
            .isEqualTo(CacheControl.noStore().getHeaderValue());
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getRoles()).containsExactly("ROLE_USER");
        assertThat(response.getBody().isAccountEnabled()).isTrue();
        verify(creationService).create(request, administrator);
        }

    @Test
    void deleteDelegatesToLifecycleServiceWithoutPhysicalDeletion() {
        User administrator = user(1L, "admin", true);

        var response = controller.deleteUser(42L, administrator);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getHeaders().getCacheControl())
                .isEqualTo(CacheControl.noStore().getHeaderValue());
        verify(lifecycleService).deactivateAndAnonymize(42L, administrator);
        verify(users, never()).delete(any(User.class));
        verify(users, never()).deleteById(any(Long.class));
    }

    @Test
    void detailResponseIncludesDeactivationState() {
        User target = user(42L, "deactivated-42", true);
        Instant deactivatedAt = Instant.parse("2026-01-01T00:00:00Z");
        target.setAccountEnabled(false);
        target.markDeactivated(deactivatedAt, 1L);
        when(users.findById(42L)).thenReturn(Optional.of(target));

        UserResponse response = controller.getUser(42L).getBody();

        assertThat(response).isNotNull();
        assertThat(response.isAccountEnabled()).isFalse();
        assertThat(response.getDeactivatedAt()).isEqualTo(deactivatedAt);
    }

    private static User user(Long id, String username, boolean enabled) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPasswordHash("password-hash");
        user.setRoles(Set.of("ROLE_ADMIN"));
        user.setAccountEnabled(enabled);
        return user;
    }
}