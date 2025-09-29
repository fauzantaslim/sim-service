import { UserRepository } from '../repositories/user.repository';
import { User } from '../models/user.model';
import { PaginationParams, PaginationResponse } from '../types/pagination.type';
import {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  GetUserRequest,
  DeleteUserRequest
} from '../types/user.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import { hashing, compareHashedData } from '../utils/hashing';
import { UserValidation } from '../validations/user.validation';
import { Validation } from '../validations/validatiom';
import logger from '../utils/logger';

/**
 * Service untuk operasi bisnis terkait user.
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Membuat user baru.
   */
  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    logger.info({
      email: userData.email,
      full_name: userData.full_name,
      message: 'Create user attempt started'
    });

    // Validasi input menggunakan Validation utility
    const validatedData = Validation.validate(UserValidation.CREATE, userData);

    // Validasi email sudah ada
    const emailExists = await this.userRepository.isEmailExists(
      validatedData.email
    );
    if (emailExists) {
      logger.warn({
        email: validatedData.email,
        message: 'Create user failed: Email already exists'
      });
      throw new ResponseError(
        StatusCodes.CONFLICT,
        'Email sudah digunakan oleh user lain'
      );
    }

    // Hash password
    const hashedPassword = await hashing(validatedData.password);

    // Buat user data untuk database
    const userToCreate: Omit<User, 'user_id'> = {
      email: validatedData.email,
      full_name: validatedData.full_name,
      password: hashedPassword,
      is_active: validatedData.is_active ?? true
    };

    const result = await this.userRepository.create(userToCreate);

    logger.info({
      user_id: result.user_id,
      email: result.email,
      full_name: result.full_name,
      message: 'Create user successful'
    });

    return result;
  }

  /**
   * Mengambil daftar user dengan pagination.
   */
  async getUsers(
    params: PaginationParams
  ): Promise<PaginationResponse<UserResponse>> {
    logger.info({
      page: params.page,
      limit: params.limit,
      search: params.search,
      message: 'Get users list attempt started'
    });

    // Validasi parameter pagination
    if (params.page < 1) {
      logger.warn({
        page: params.page,
        message: 'Get users failed: Invalid page number'
      });
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Halaman harus lebih dari 0'
      );
    }

    if (params.limit < 1 || params.limit > 100) {
      logger.warn({
        limit: params.limit,
        message: 'Get users failed: Invalid limit'
      });
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Limit harus antara 1-100'
      );
    }

    const result = await this.userRepository.findAll(params);

    logger.info({
      page: params.page,
      limit: params.limit,
      total_items: result.pagination.total_items,
      total_pages: result.pagination.total_pages,
      message: 'Get users list successful'
    });

    return result;
  }

  /**
   * Mengambil detail user berdasarkan ID.
   */
  async getUserById(request: GetUserRequest): Promise<UserResponse> {
    logger.info({
      user_id: request.user_id,
      message: 'Get user by ID attempt started'
    });

    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(UserValidation.GET, request);

    const user = await this.userRepository.findById(validatedParams.user_id);

    if (!user) {
      logger.warn({
        user_id: validatedParams.user_id,
        message: 'Get user by ID failed: User not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'User tidak ditemukan');
    }

    logger.info({
      user_id: user.user_id,
      email: user.email,
      message: 'Get user by ID successful'
    });

    return user;
  }

  /**
   * Memperbarui data user.
   */
  async updateUser(request: UpdateUserRequest): Promise<UserResponse> {
    logger.info({
      user_id: request.user_id,
      message: 'Update user attempt started'
    });

    // Validasi parameter dan data menggunakan Validation utility
    const validatedData = Validation.validate(UserValidation.UPDATE, request);

    // Cek user ada atau tidak
    const existingUser = await this.userRepository.findById(
      validatedData.user_id
    );
    if (!existingUser) {
      logger.warn({
        user_id: validatedData.user_id,
        message: 'Update user failed: User not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'User tidak ditemukan');
    }

    // Validasi email jika diupdate
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await this.userRepository.isEmailExists(
        validatedData.email,
        validatedData.user_id
      );
      if (emailExists) {
        logger.warn({
          user_id: validatedData.user_id,
          email: validatedData.email,
          message: 'Update user failed: Email already exists'
        });
        throw new ResponseError(
          StatusCodes.CONFLICT,
          'Email sudah digunakan oleh user lain'
        );
      }
    }

    // Hash password jika diupdate
    const updateData: Partial<Omit<User, 'user_id'>> = { ...validatedData };
    if (validatedData.password) {
      updateData.password = await hashing(validatedData.password);
    }

    // Hapus user_id dari update data karena tidak boleh diupdate
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id: _user_id, ...dataToUpdate } = updateData as Partial<
      Omit<User, 'user_id'>
    > & { user_id?: string };

    const updatedUser = await this.userRepository.update(
      validatedData.user_id,
      dataToUpdate
    );
    if (!updatedUser) {
      logger.error({
        user_id: validatedData.user_id,
        message: 'Update user failed: Database update failed'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal memperbarui user'
      );
    }

    logger.info({
      user_id: updatedUser.user_id,
      email: updatedUser.email,
      message: 'Update user successful'
    });

    return updatedUser;
  }

  /**
   * Menghapus user.
   */
  async deleteUser(request: DeleteUserRequest): Promise<void> {
    logger.info({
      user_id: request.user_id,
      message: 'Delete user attempt started'
    });

    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(UserValidation.DELETE, request);

    const userExists = await this.userRepository.findById(
      validatedParams.user_id
    );
    if (!userExists) {
      logger.warn({
        user_id: validatedParams.user_id,
        message: 'Delete user failed: User not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'User tidak ditemukan');
    }

    const deleted = await this.userRepository.delete(validatedParams.user_id);
    if (!deleted) {
      logger.error({
        user_id: validatedParams.user_id,
        message: 'Delete user failed: Database delete failed'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal menghapus user'
      );
    }

    logger.info({
      user_id: validatedParams.user_id,
      email: userExists.email,
      message: 'Delete user successful'
    });
  }

  /**
   * Mengambil user berdasarkan email (untuk autentikasi).
   */
  async getUserByEmail(email: string): Promise<User | null> {
    logger.info({
      email,
      message: 'Get user by email attempt started'
    });

    const user = await this.userRepository.findByEmail(email);

    if (user) {
      logger.info({
        user_id: user.user_id,
        email,
        message: 'Get user by email successful'
      });
    } else {
      logger.warn({
        email,
        message: 'Get user by email failed: User not found'
      });
    }

    return user;
  }

  /**
   * Memverifikasi password user.
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    logger.info({
      message: 'Password verification attempt started'
    });

    const isValid = await compareHashedData(plainPassword, hashedPassword);

    logger.info({
      is_valid: isValid,
      message: 'Password verification completed'
    });

    return isValid;
  }
}
