package com.emp.proj.employee_register.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.emp.proj.employee_register.entities.User;
import com.emp.proj.employee_register.services.IUserService;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private IUserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable int id) {
        try {
            System.out.println("getUserById called for ID: " + id);
            User user = userService.getUserById(id);

            if (user == null) {
                System.out.println("User not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }

            System.out.println("Found user: " + user.getUserName() + " with ID: " + user.getUserId());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            System.err.println("Error retrieving user by ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("")
    public ResponseEntity<User> addUser(@RequestBody User user) {
        try {
            System.out.println("addUser called for Username: " + user.getUserName());
            User savedUser = userService.addUser(user);
            System.out.println("User saved with ID: " + savedUser.getUserId());

            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
        } catch (Exception e) {
            System.err.println("Error adding user: " + e.getMessage());
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable int id, @RequestBody User user) {
        try {
            System.out.println("updateUser called for ID: " + id);

            user.setUserId(id);
            User updatedUser = userService.updateUser(user);
            System.out.println("User updated with ID: " + updatedUser.getUserId());

            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException ex) {
            System.out.println("Error updating user: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable int id) {
        if (userService.deleteUser(id)) {  
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping("")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
}
