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
    // Validasi input menggunakan Validation utility
    const validatedData = Validation.validate(UserValidation.CREATE, userData);

    // Validasi email sudah ada
    const emailExists = await this.userRepository.isEmailExists(
      validatedData.email
    );
    if (emailExists) {
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

    return await this.userRepository.create(userToCreate);
  }

  /**
   * Mengambil daftar user dengan pagination.
   */
  async getUsers(
    params: PaginationParams
  ): Promise<PaginationResponse<UserResponse>> {
    // Validasi parameter pagination
    if (params.page < 1) {
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Halaman harus lebih dari 0'
      );
    }

    if (params.limit < 1 || params.limit > 100) {
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Limit harus antara 1-100'
      );
    }

    return await this.userRepository.findAll(params);
  }

  /**
   * Mengambil detail user berdasarkan ID.
   */
  async getUserById(request: GetUserRequest): Promise<UserResponse> {
    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(UserValidation.GET, request);

    const user = await this.userRepository.findById(validatedParams.user_id);

    if (!user) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'User tidak ditemukan');
    }

    return user;
  }

  /**
   * Memperbarui data user.
   */
  async updateUser(request: UpdateUserRequest): Promise<UserResponse> {
    // Validasi parameter dan data menggunakan Validation utility
    const validatedData = Validation.validate(UserValidation.UPDATE, request);

    // Cek user ada atau tidak
    const existingUser = await this.userRepository.findById(
      validatedData.user_id
    );
    if (!existingUser) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'User tidak ditemukan');
    }

    // Validasi email jika diupdate
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await this.userRepository.isEmailExists(
        validatedData.email,
        validatedData.user_id
      );
      if (emailExists) {
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
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal memperbarui user'
      );
    }

    return updatedUser;
  }

  /**
   * Menghapus user.
   */
  async deleteUser(request: DeleteUserRequest): Promise<void> {
    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(UserValidation.DELETE, request);

    const userExists = await this.userRepository.findById(
      validatedParams.user_id
    );
    if (!userExists) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'User tidak ditemukan');
    }

    const deleted = await this.userRepository.delete(validatedParams.user_id);
    if (!deleted) {
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal menghapus user'
      );
    }
  }

  /**
   * Mengambil user berdasarkan email (untuk autentikasi).
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Memverifikasi password user.
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await compareHashedData(plainPassword, hashedPassword);
  }
}
