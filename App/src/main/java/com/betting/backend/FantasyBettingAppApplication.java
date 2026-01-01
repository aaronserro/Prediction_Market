package com.betting.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication      // scans com.betting.backend.* by default
@EnableJpaRepositories(basePackages = "com.betting.backend") // picks up repositories
@EntityScan(basePackages = "com.betting.backend")            // picks up @Entity classes
@EnableScheduling
public class FantasyBettingAppApplication {
  public static void main(String[] args) {
    SpringApplication.run(FantasyBettingAppApplication.class, args);
  }
}







