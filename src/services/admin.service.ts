import { AdminRepository } from '../repositories/admin.repository';
import { Admin } from '../models/admin';
import { PaginationParams, PaginationResponse } from '../types/pagination.type';
import {
  AdminResponse,
  CreateAdminRequest,
  UpdateAdminRequest,
  GetAdminRequest,
  DeleteAdminRequest
} from '../types/admin.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import { AdminValidation } from '../validations/admin.validation';
import { Validation } from '../validations/validatiom';
import logger from '../utils/logger';

/**
 * Service untuk operasi bisnis terkait Admin.
 */
export class AdminService {
  private adminRepository: AdminRepository;

  constructor() {
    this.adminRepository = new AdminRepository();
  }

  /**
   * Membuat Admin baru.
   */
  async createAdmin(adminData: CreateAdminRequest): Promise<AdminResponse> {
    logger.info({
      email: adminData.email,
      message: 'Create Admin attempt started'
    });

    // Validasi input menggunakan Validation utility
    const validatedData = Validation.validate(
      AdminValidation.CREATE,
      adminData
    );

    // Validasi email Admin sudah ada
    const emailExists = await this.adminRepository.isEmailExists(
      validatedData.email
    );
    if (emailExists) {
      logger.warn({
        email: validatedData.email,
        message: 'Create Admin failed: Email already exists'
      });
      throw new ResponseError(
        StatusCodes.CONFLICT,
        `Admin dengan email "${validatedData.email}" sudah ada`
      );
    }

    // Buat Admin data untuk database
    const adminToCreate: Omit<Admin, 'admin_id' | 'created_at' | 'updated_at'> =
      {
        email: validatedData.email,
        full_name: validatedData.full_name,
        password: validatedData.password
      };

    const result = await this.adminRepository.create(adminToCreate);

    logger.info({
      admin_id: result.admin_id,
      email: result.email,
      message: 'Create Admin successful'
    });

    return result;
  }

  /**
   * Mengambil daftar Admin dengan pagination.
   */
  async getAdminList(
    params: PaginationParams
  ): Promise<PaginationResponse<AdminResponse>> {
    logger.info({
      page: params.page,
      limit: params.limit,
      search: params.search,
      message: 'Get Admin list attempt started'
    });

    // Validasi parameter pagination
    if (params.page < 1) {
      logger.warn({
        page: params.page,
        message: 'Get Admin failed: Invalid page number'
      });
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Halaman harus lebih dari 0'
      );
    }

    if (params.limit < 1 || params.limit > 100) {
      logger.warn({
        limit: params.limit,
        message: 'Get Admin failed: Invalid limit'
      });
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Limit harus antara 1-100'
      );
    }

    const result = await this.adminRepository.findAll(params);

    logger.info({
      page: params.page,
      limit: params.limit,
      total_items: result.pagination.total_items,
      total_pages: result.pagination.total_pages,
      message: 'Get Admin list successful'
    });

    return result;
  }

  /**
   * Mengambil detail Admin berdasarkan ID.
   */
  async getAdminById(request: GetAdminRequest): Promise<AdminResponse> {
    logger.info({
      admin_id: request.admin_id,
      message: 'Get Admin by ID attempt started'
    });

    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(AdminValidation.GET, request);

    const admin = await this.adminRepository.findById(validatedParams.admin_id);

    if (!admin) {
      logger.warn({
        admin_id: validatedParams.admin_id,
        message: 'Get Admin by ID failed: Admin not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'Admin tidak ditemukan');
    }

    logger.info({
      admin_id: admin.admin_id,
      email: admin.email,
      message: 'Get Admin by ID successful'
    });

    return admin;
  }

  /**
   * Memperbarui data Admin.
   */
  async updateAdmin(request: UpdateAdminRequest): Promise<AdminResponse> {
    logger.info({
      admin_id: request.admin_id,
      message: 'Update Admin attempt started'
    });

    // Validasi parameter dan data menggunakan Validation utility
    const validatedData = Validation.validate(AdminValidation.UPDATE, request);

    // Cek Admin ada atau tidak
    const existingAdmin = await this.adminRepository.findById(
      validatedData.admin_id
    );
    if (!existingAdmin) {
      logger.warn({
        admin_id: validatedData.admin_id,
        message: 'Update Admin failed: Admin not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'Admin tidak ditemukan');
    }

    // Validasi email Admin jika diupdate
    if (validatedData.email && validatedData.email !== existingAdmin.email) {
      const emailExists = await this.adminRepository.isEmailExists(
        validatedData.email,
        validatedData.admin_id
      );
      if (emailExists) {
        logger.warn({
          admin_id: validatedData.admin_id,
          email: validatedData.email,
          message: 'Update Admin failed: Email already exists'
        });
        throw new ResponseError(
          StatusCodes.CONFLICT,
          `Admin dengan email "${validatedData.email}" sudah ada`
        );
      }
    }

    // Hapus admin_id dari update data karena tidak boleh diupdate
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { admin_id: _admin_id, ...dataToUpdate } = validatedData as Partial<
      Omit<Admin, 'admin_id' | 'created_at'>
    > & { admin_id?: string };

    const updatedAdmin = await this.adminRepository.update(
      validatedData.admin_id,
      dataToUpdate
    );
    if (!updatedAdmin) {
      logger.error({
        admin_id: validatedData.admin_id,
        message: 'Update Admin failed: Database update failed'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal memperbarui Admin'
      );
    }

    logger.info({
      admin_id: updatedAdmin.admin_id,
      email: updatedAdmin.email,
      message: 'Update Admin successful'
    });

    return updatedAdmin;
  }

  /**
   * Menghapus Admin.
   */
  async deleteAdmin(request: DeleteAdminRequest): Promise<void> {
    logger.info({
      admin_id: request.admin_id,
      message: 'Delete Admin attempt started'
    });

    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(
      AdminValidation.DELETE,
      request
    );

    const adminExists = await this.adminRepository.findById(
      validatedParams.admin_id
    );
    if (!adminExists) {
      logger.warn({
        admin_id: validatedParams.admin_id,
        message: 'Delete Admin failed: Admin not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'Admin tidak ditemukan');
    }

    const deleted = await this.adminRepository.delete(validatedParams.admin_id);
    if (!deleted) {
      logger.error({
        admin_id: validatedParams.admin_id,
        message: 'Delete Admin failed: Database delete failed'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal menghapus Admin'
      );
    }

    logger.info({
      admin_id: validatedParams.admin_id,
      email: adminExists.email,
      message: 'Delete Admin successful'
    });
  }
}
