package com.emp.proj.employee_register.services;

import com.emp.proj.employee_register.entities.User;
import com.emp.proj.employee_register.repository.IUserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService implements IUserService {

    @Autowired
    private IUserRepository userRepository;

    @Override
    @Transactional
    public User addUser(User user) {
        // Validate username is unique
        if (userRepository.existsByUserName(user.getUserName())) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Validate email is unique if provided
        if (user.getEmail() != null && !user.getEmail().isEmpty() && userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Set default role if not provided
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }

        return userRepository.save(user);
    }

    @Override
    public User getUserById(int id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUserName(username)
                .orElse(null);
    }

    @Override
    @Transactional
    public User updateUser(User user) {
        // Check if user exists
        User existingUser = userRepository.findById(user.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + user.getUserId()));

        // Check if username is being changed and if it already exists
        if (!existingUser.getUserName().equals(user.getUserName()) &&
                userRepository.existsByUserName(user.getUserName())) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Check if email is being changed and if it already exists
        if (user.getEmail() != null && !user.getEmail().isEmpty() &&
                !user.getEmail().equals(existingUser.getEmail()) &&
                userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Update fields
        existingUser.setUserName(user.getUserName());

        // Only update password if provided
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existingUser.setPassword(user.getPassword());
        }

        existingUser.setEmail(user.getEmail());
        existingUser.setRole(user.getRole());

        return userRepository.save(existingUser);
    }

    @Override
    @Transactional
    public boolean deleteUser(int id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean deleteUserById(int id) {
        // This method delegates to the interface method for consistency
        return deleteUser(id);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
