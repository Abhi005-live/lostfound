package lostofound.repository;

import lostofound.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE m.itemId = :itemId AND (m.senderId = :userId OR m.receiverId = :userId) ORDER BY m.timestamp ASC")
    List<Message> findConversation(Long itemId, Long userId);

    @Query("SELECT m FROM Message m WHERE m.itemId = :itemId ORDER BY m.timestamp ASC")
    List<Message> findAllByItemId(Long itemId);
}
