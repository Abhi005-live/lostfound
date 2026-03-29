package lostofound.controller;

import lostofound.entity.Message;
import lostofound.entity.User;
import lostofound.repository.MessageRepository;
import lostofound.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(MessageRepository messageRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // Send a message — encryptedContent is already encrypted on the frontend
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Message message, @RequestHeader("X-User-Id") Long userId) {
        User sender = userRepository.findById(userId).orElse(null);
        if (sender == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        message.setSenderId(userId);
        message.setSenderName(sender.getUsername());
        Message saved = messageRepository.save(message);

        // Push real-time to item chat room
        messagingTemplate.convertAndSend("/topic/chat/" + message.getItemId(), saved);
        return ResponseEntity.ok(saved);
    }

    // Get messages for an item — only sender, receiver, or admin can see
    @GetMapping("/{itemId}")
    public ResponseEntity<?> getMessages(@PathVariable Long itemId, @RequestHeader("X-User-Id") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<Message> messages = "admin".equals(user.getRole())
                ? messageRepository.findAllByItemId(itemId)
                : messageRepository.findConversation(itemId, userId);

        return ResponseEntity.ok(messages);
    }

    // Admin-only: get all conversations for an item
    @GetMapping("/admin/{itemId}")
    public ResponseEntity<?> adminGetMessages(@PathVariable Long itemId, @RequestHeader("X-User-Id") Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !"admin".equals(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        return ResponseEntity.ok(messageRepository.findAllByItemId(itemId));
    }
}
