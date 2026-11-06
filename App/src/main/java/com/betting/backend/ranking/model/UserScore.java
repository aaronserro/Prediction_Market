package com.betting.backend.ranking.model;

import jakarta.persistence.*;
@Entity
@Table(name = "user_scores")
public class UserScore {
    private final float pred_wgt = 0.55f;
    private final float trade_wgt = 0.45f;


    @Id
    private String userId;

    private double predictorPoints;
    private double traderPoints;

    // Getters and Setters
    public String getUserId() {
        return userId;
    }
    public float getScore(float predpoints, float traderpoints){
        float total_score = pred_wgt*predpoints + trade_wgt*traderpoints;
        return total_score;

    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public double getPredictorPoints() {
        return predictorPoints;
    }

    public void setPredictorPoints(double predictorPoints) {
        this.predictorPoints = predictorPoints;
    }

    public double getTraderPoints() {
        return traderPoints;
    }

    public void setTraderPoints(double traderPoints) {
        this.traderPoints = traderPoints;
    }
}