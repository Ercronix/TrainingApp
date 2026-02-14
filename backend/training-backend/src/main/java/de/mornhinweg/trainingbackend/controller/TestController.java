package de.mornhinweg.trainingbackend.controller;

import de.mornhinweg.trainingbackend.model.User;
import de.mornhinweg.trainingbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

  private final UserRepository userRepository;

  @GetMapping("/hello")
  public String hello() {
    return "Hello from Training Backend! 🏋️";
  }

  @GetMapping("/users")
  public List<User> getAllUsers() {
    return userRepository.findAll();
  }

  @PostMapping("/users")
  public User createUser(@RequestBody User user) {
    return userRepository.save(user);
  }
}