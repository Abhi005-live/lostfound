package lostofound.service;

import lostofound.entity.Item;
import lostofound.repository.ItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ItemService {

    private final ItemRepository itemRepository;

    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public List<Item> getItems(String search, String type) {
        boolean hasSearch = search != null && !search.isBlank();
        boolean hasType = type != null && !type.isBlank();
        if (hasSearch && hasType) return itemRepository.findByTitleContainingIgnoreCaseAndType(search, type);
        if (hasSearch) return itemRepository.findByTitleContainingIgnoreCase(search);
        if (hasType) return itemRepository.findByType(type);
        return itemRepository.findAll();
    }

    public Optional<Item> getItemById(Long id) {
        return itemRepository.findById(id);
    }

    public Item createItem(Item item) {
        return itemRepository.save(item);
    }

    public Item updateItem(Long id, Item updated) {
        Item item = itemRepository.findById(id).orElseThrow(() -> new RuntimeException("Item not found"));
        if (updated.getTitle() != null) item.setTitle(updated.getTitle());
        if (updated.getDescription() != null) item.setDescription(updated.getDescription());
        if (updated.getLocation() != null) item.setLocation(updated.getLocation());
        if (updated.getLatitude() != null) item.setLatitude(updated.getLatitude());
        if (updated.getLongitude() != null) item.setLongitude(updated.getLongitude());
        if (updated.getType() != null) item.setType(updated.getType());
        if (updated.getImage() != null) item.setImage(updated.getImage());
        if (updated.getDate() != null) item.setDate(updated.getDate());
        return itemRepository.save(item);
    }

    public void deleteItem(Long id) {
        itemRepository.deleteById(id);
    }
}
