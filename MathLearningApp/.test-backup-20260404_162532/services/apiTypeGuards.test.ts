import {isApiSuccess, isApiError, getApiDataOrThrow} from '../api';
import {ApiResponse, User} from '../../types';

describe('API Type Guards', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('isApiSuccess', () => {
    it('should return true for successful response with data', () => {
      const response: ApiResponse<User> = {
        success: true,
        data: mockUser,
      };

      expect(isApiSuccess(response)).toBe(true);
      if (isApiSuccess(response)) {
        // TypeScript should know response.data exists here
        expect(response.data.email).toBe('test@example.com');
      }
    });

    it('should return false for failed response', () => {
      const response: ApiResponse<User> = {
        success: false,
        error: {
          code: 'ERROR',
          message: 'Failed',
        },
      };

      expect(isApiSuccess(response)).toBe(false);
    });

    it('should return false for response without data', () => {
      const response: ApiResponse<User> = {
        success: true,
        message: 'OK but no data',
      };

      expect(isApiSuccess(response)).toBe(false);
    });
  });

  describe('isApiError', () => {
    it('should return true for failed response with error', () => {
      const response: ApiResponse<User> = {
        success: false,
        error: {
          code: 'ERROR',
          message: 'Failed',
        },
      };

      expect(isApiError(response)).toBe(true);
      if (isApiError(response)) {
        // TypeScript should know response.error exists here
        expect(response.error.code).toBe('ERROR');
      }
    });

    it('should return false for successful response', () => {
      const response: ApiResponse<User> = {
        success: true,
        data: mockUser,
      };

      expect(isApiError(response)).toBe(false);
    });

    it('should return false for response without error', () => {
      const response: ApiResponse<User> = {
        success: false,
        message: 'Failed but no error object',
      };

      expect(isApiError(response)).toBe(false);
    });
  });

  describe('getApiDataOrThrow', () => {
    it('should return data for successful response', () => {
      const response: ApiResponse<User> = {
        success: true,
        data: mockUser,
      };

      const data = getApiDataOrThrow(response);
      expect(data).toBe(mockUser);
    });

    it('should throw error for failed response', () => {
      const response: ApiResponse<User> = {
        success: false,
        error: {
          code: 'ERROR',
          message: 'Something went wrong',
        },
      };

      expect(() => getApiDataOrThrow(response)).toThrow('Something went wrong');
    });

    it('should throw default error message when error not specified', () => {
      const response: ApiResponse<User> = {
        success: false,
      };

      expect(() => getApiDataOrThrow(response)).toThrow('API request failed');
    });
  });

  describe('Type Narrowing Usage', () => {
    it('should enable type-safe data access', () => {
      const response: ApiResponse<User> = {
        success: true,
        data: mockUser,
      };

      if (isApiSuccess(response)) {
        // response.data is known to exist here
        expect(response.data.name.toUpperCase()).toBe('TEST USER');
      } else {
        // response.error is known to exist here
        const error = response.error; // Type is still optional
        expect(error).toBeUndefined();
      }
    });

    it('should enable type-safe error handling', () => {
      const response: ApiResponse<User> = {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed',
        },
      };

      if (isApiError(response)) {
        // response.error is known to exist here
        expect(response.error.code).toBe('AUTH_ERROR');
      } else {
        // response.data is known to exist here
        const data = response.data; // Type is still optional
        expect(data).toBeUndefined();
      }
    });
  });
});
