// Import the main Arcjet function and the tokenBucket rate limiter utility
import arcjet, { tokenBucket } from "@arcjet/next";

// Initialize Arcjet with configuration
const aj = arcjet({
  key: process.env.ARCJET_KEY, // API key for authenticating with Arcjet (stored in environment variable)

  characteristics: ["userId"], // Apply rate limiting based on the unique 'userId' (likely from Clerk)

  rules: [
    // Define a token bucket rate limiting rule for controlling specific actions
    tokenBucket({
      mode: "LIVE",       // Use LIVE mode (applies in real time; change to DRY_RUN for testing)
      refillRate: 10,     // Allow 10 new tokens per interval (10 actions/hour)
      interval: 3600,     // Interval of 3600 seconds = 1 hour
      capacity: 10,       // Max tokens (burst capacity) — allows short bursts up to 10 actions instantly
    }),
  ],
});

// Export the configured Arcjet instance to be used in middleware or API routes
export default aj;
