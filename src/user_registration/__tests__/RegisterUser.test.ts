import { describe, it, expect, vi } from 'vitest';
import { handle } from '../register_user/RegisterUser.js';
import { v7 as uuidv7 } from 'uuid';
import bcrypt from 'bcrypt';

// Mock uuid
vi.mock('uuid', () => ({
    v7: vi.fn(() => 'mocked-uuid')
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
    hash: vi.fn(() => Promise.resolve('hashed-password'))
}));

describe('RegisterUser Command Handler', () => {
    const mockGetExistingUser = vi.fn();
    const mockSaveUser = vi.fn();
    const mockHashPassword = vi.fn(() => Promise.resolve('hashed-password'));

    const validCommand = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
    };

    it('should successfully register a new user', async () => {
        // Arrange
        mockGetExistingUser.mockResolvedValue(null);
        mockSaveUser.mockImplementation(user => Promise.resolve(user));

        // Act
        const result = await handle(validCommand, {
            getExistingUserByEmailOrUsername: mockGetExistingUser,
            saveUser: mockSaveUser,
            passwordHasher: mockHashPassword
        });

        // Assert
        expect(result).toEqual({
            id: 'mocked-uuid',
            username: 'testuser',
            email: 'test@example.com',
            hashedPassword: 'hashed-password'
        });

        expect(mockGetExistingUser).toHaveBeenCalledWith('testuser', 'test@example.com');
        expect(mockHashPassword).toHaveBeenCalledWith('password123');
        expect(mockSaveUser).toHaveBeenCalledWith({
            id: 'mocked-uuid',
            username: 'testuser',
            email: 'test@example.com',
            hashedPassword: 'hashed-password'
        });
    });

    it('should propagate save errors', async () => {
        // Arrange
        mockGetExistingUser.mockResolvedValue(null);
        mockSaveUser.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(handle(validCommand, {
            getExistingUserByEmailOrUsername: mockGetExistingUser,
            saveUser: mockSaveUser,
            passwordHasher: mockHashPassword
        })).rejects.toThrow('Database error');

        expect(mockGetExistingUser).toHaveBeenCalledWith('testuser', 'test@example.com');
        expect(mockSaveUser).toHaveBeenCalled();
    });
}); 