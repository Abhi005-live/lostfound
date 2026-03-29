package lostofound.repository;

import lostofound.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByTitleContainingIgnoreCase(String title);
    List<Item> findByType(String type);
    List<Item> findByTitleContainingIgnoreCaseAndType(String title, String type);
}
