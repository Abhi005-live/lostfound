package lostofound.controller;

import lostofound.entity.Item;
import lostofound.entity.User;
import lostofound.service.ItemService;
import lostofound.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final ItemService itemService;

    public AdminController(UserService userService, ItemService itemService) {
        this.userService = userService;
        this.itemService = itemService;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        List<Item> items = itemService.getAllItems();
        List<User> users = userService.getAllUsers();
        long lost = items.stream().filter(i -> "lost".equals(i.getType())).count();
        long found = items.stream().filter(i -> "found".equals(i.getType())).count();
        return ResponseEntity.ok(Map.of(
            "totalItems", items.size(),
            "lostItems", lost,
            "foundItems", found,
            "totalUsers", users.size()
        ));
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}/make-admin")
    public ResponseEntity<User> makeAdmin(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userService.makeAdmin(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/items")
    public List<Item> getAllItems() {
        return itemService.getAllItems();
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<Item> updateItem(@PathVariable Long id, @RequestBody Item item) {
        try {
            return ResponseEntity.ok(itemService.updateItem(id, item));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
