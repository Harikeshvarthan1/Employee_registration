package com.emp.proj.employee_register.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.emp.proj.employee_register.entities.User;

@Repository
public interface IUserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUserName(String userName);

    Optional<User> findByEmail(String email);

    List<User> findByRole(String role);

    boolean existsByUserName(String userName);

    boolean existsByEmail(String email);

    List<User> findByUserNameContaining(String searchTerm);
}
