package com.emp.proj.employee_register.services;

import java.util.List;

import com.emp.proj.employee_register.entities.User;

public interface IUserService {
    User addUser(User user);
    User getUserById(int id);
    User getUserByUsername(String username);
    User updateUser(User user);
    boolean deleteUser(int id);
    boolean deleteUserById(int id);
    List<User> getAllUsers();
}