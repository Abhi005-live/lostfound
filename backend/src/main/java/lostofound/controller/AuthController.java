package lostofound.controller;

import lostofound.entity.User;
import lostofound.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User saved = userService.register(user);
            return ResponseEntity.ok(Map.of("message", "User registered successfully", "id", saved.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        return userService.login(user.getUsername(), user.getPassword())
                .map(u -> ResponseEntity.ok(Map.of("message", "Login successful", "id", u.getId(), "username", u.getUsername(), "role", u.getRole())))
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid username or password")));
    }
}
