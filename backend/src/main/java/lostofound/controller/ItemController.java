package lostofound.controller;

import lostofound.entity.Item;
import lostofound.service.ItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping
    public List<Item> getItems(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type) {
        return itemService.getItems(search, type);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        return itemService.getItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Item> createItem(@RequestBody Item item, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (item.getType() == null || (!item.getType().equals("lost") && !item.getType().equals("found"))) {
            return ResponseEntity.badRequest().build();
        }
        if (item.getTitle() == null || item.getTitle().isBlank()) {
            item.setTitle("Untitled " + item.getType().substring(0,1).toUpperCase() + item.getType().substring(1));
        }
        if (userId != null) item.setReportedBy(userId);
        return ResponseEntity.ok(itemService.createItem(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(@PathVariable Long id, @RequestBody Item item) {
        try {
            return ResponseEntity.ok(itemService.updateItem(id, item));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
