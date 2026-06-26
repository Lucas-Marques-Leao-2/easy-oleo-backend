import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import type { UserRole } from "@prisma/client";

import { UsersRepository } from "../users/users.repository";

@Injectable()
export class AuthContextService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async resolveRoleByExternalId(externalId: string): Promise<UserRole> {
    try {
      const user = await this.usersRepository.findByExternalId(externalId);
      if (!user) {
        throw new UnauthorizedException("Usuário não encontrado.");
      }
      return user.role;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException("Erro ao verificar permissões.");
    }
  }
}
