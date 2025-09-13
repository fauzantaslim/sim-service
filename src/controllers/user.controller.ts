import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { UserRequest } from '../types/request.type';
import { PaginationParams } from '../types/pagination.type';
import { StatusCodes } from 'http-status-codes';
import {
  CreateUserRequest,
  DeleteUserRequest,
  GetUserRequest,
  UpdateUserRequest
} from '../types/user.type';

/**
 * Controller untuk menangani request terkait user.
 */
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Membuat user baru.
   * POST /users
   */
  createUser = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: CreateUserRequest = req.body as CreateUserRequest;
      const newUser = await this.userService.createUser(request);

      res.status(StatusCodes.CREATED).json({
        success: true,
        status_code: StatusCodes.CREATED,
        message: 'User berhasil dibuat',
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil daftar user dengan pagination.
   * GET /users
   */
  getUsers = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      // Validasi query parameters
      const paginationParams: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sort_by: req.query.sort_by as string,
        sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc'
      };

      const result = await this.userService.getUsers(paginationParams);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Daftar user berhasil diambil',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil detail user berdasarkan ID.
   * GET /users/:user_id
   */
  getUserById = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: GetUserRequest = {
        user_id: req.params.userId
      };

      const user = await this.userService.getUserById(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Detail user berhasil diambil',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Memperbarui data user.
   * PUT /users/:user_id
   */
  updateUser = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: UpdateUserRequest = req.body;
      request.user_id = req.params.userId;
      const updatedUser = await this.userService.updateUser(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'User berhasil diperbarui',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Menghapus user.
   * DELETE /users/:user_id
   */
  deleteUser = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: DeleteUserRequest = {
        user_id: req.params.userId
      };
      await this.userService.deleteUser(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'User berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  };
}
