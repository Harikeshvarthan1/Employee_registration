package com.emp.proj.employee_register.repository;

import com.emp.proj.employee_register.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface IUserRepository extends JpaRepository<User, Integer> {

    // Find user by user name
    Optional<User> findByUserName(String userName);

    // Find user by email
    Optional<User> findByEmail(String email);

    // Find users by role
    List<User> findByRole(String role);

    // Check if a user name exists
    boolean existsByUserName(String userName);

    // Check if an email exists
    boolean existsByEmail(String email);

    // Find users by user name containing the search term
    List<User> findByUserNameContaining(String searchTerm);
}
