import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import type { Request, Response } from "express";
import { db } from "../db/db";
import * as tokenUtils from "../utils/generateTokens";
import * as mailUtils from "../utils/mail";
import { ApiError } from "../utils/apiError";
import { registerUser } from "../controllers/auth.controller";


// Mocking external modules and globals
// This is crucial for isolating our controller logic for unit/integration testing.

// Mock the database module
mock.module("../db/db", () => ({
  db: {
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock().mockResolvedValue([]), // Default behavior: user not found
        })),
      })),
    })),
    insert: mock(() => ({
      values: mock(() => ({
        returning: mock().mockResolvedValue([]), // Default behavior: insertion returns nothing
      })),
    })),
    update: mock(() => ({
      set: mock(() => ({
        where: mock().mockResolvedValue(undefined),
      })),
    })),
  },
}));

// Mock our utility function for generating tokens
mock.module("../utils/generateTokens", () => ({
  generateVerificationToken: mock().mockResolvedValue({
    unhashedToken: "test-unhashed-token",
    hashedToken: "test-hashed-token",
    tokenExpiry: new Date(Date.now() + 3600000), // Expires in 1 hour
  }),
}));

// Mock our mail sending utility
mock.module("../utils/mail", () => ({
  sendMail: mock().mockResolvedValue(undefined),
  emailVerificationGenContent: mock(() => "Mocked email content"),
}));

describe("Auth Controller - registerUser", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let resStatus: ReturnType<typeof mock>;
  let resJson: ReturnType<typeof mock>;
  let mockNext: ReturnType<typeof mock>;

  // `beforeEach` is a setup function that runs before every `it` block in this `describe` suite.
  // It's perfect for resetting state and mocks to ensure tests don't interfere with each other.
  beforeEach(() => {
    // Reset mock function call history
    (db.select as any).mockClear();
    (db.insert as any).mockClear();
    (db.update as any).mockClear();
    (tokenUtils.generateVerificationToken as any).mockClear();
    (mailUtils.sendMail as any).mockClear();

    // Use spyOn to mock the methods of the readonly Bun.password object
    spyOn(Bun.password, "hash").mockResolvedValue("hashed-password-from-bun");
    mockNext = mock(() => {});

    // Create fresh mock Express Request and Response objects for each test
    mockReq = {
      body: {
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      },
    };

    // We mock the response methods to capture what our controller tries to send back.
    resJson = mock((body) => mockRes);
    resStatus = mock((statusCode) => {
        mockRes.statusCode = statusCode;
        return { json: resJson };
    });
    mockRes = {
      status: resStatus,
      json: resJson,
    };
  });

  afterEach(() => {
    mock.restore(); // This is crucial to restore all spies created with spyOn
  });

  it("should register a new user successfully", async () => {
    // --- Arrange ---
    // Define the expected new user data that the database will "return"
    const newUser = {
      id: "user-id-123",
      ...mockReq.body,
      isEmailVerified: false,
    };

    // Configure our mocks for this specific test case
    // 1. db.select should find no existing user
    (db.select as any).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    });

    // 2. db.insert should "return" our new user
    (db.insert as any).mockReturnValueOnce({
      values: () => ({ returning: () => Promise.resolve([newUser]) }),
    });

    // --- Act ---
    // Call the controller function with our mocked request and response
    await registerUser(mockReq as Request, mockRes as Response, mockNext);

    // --- Assert ---
    // Check that our dependencies were called correctly
    expect(Bun.password.hash).toHaveBeenCalledWith("password123");
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledTimes(1); // For the verification token
    expect(mailUtils.sendMail).toHaveBeenCalledTimes(1);

    // Ensure the error handler was not called
    expect(mockNext).not.toHaveBeenCalled();

    // Check that the HTTP response is correct
    expect(resStatus).toHaveBeenCalledWith(201);
    expect(resJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 201,
        success: true,
        message: "User registered successfully. Please check your email to verify your account.",
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            isEmailVerified: false,
          },
        },
      })
    );
  });

  it("should call next with a 409 ApiError if user already exists", async () => {
    // --- Arrange ---
    const existingUser = { id: "user-id-456", email: "test@example.com" };

    // Configure db.select to "find" an existing user this time
    (db.select as any).mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([existingUser]) }) }),
    });

    // --- Act & Assert ---
    // The asyncHandler will catch the thrown ApiError and pass it to `next`.
    // So, we expect `registerUser` to resolve, and `mockNext` to be called with the error.
    await registerUser(mockReq as Request, mockRes as Response, mockNext);

    // Verify that the `next` function was called exactly once.
    expect(mockNext).toHaveBeenCalledTimes(1);
    // Verify that `next` was called with an instance of ApiError with the correct message and status.
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 409,
      message: "User with this email already exists",
    }));

    // Verify that no further actions were taken (no password hashing, no db insert, no email)
    expect(Bun.password.hash).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
    expect(mailUtils.sendMail).not.toHaveBeenCalled();
  });
});
