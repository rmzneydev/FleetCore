import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import type { AuthenticatedUser, JwtPayload } from './jwt-payload.interface.js';
import { UserRole } from './role.enum.js';
import { User } from './user.entity.js';

type SafeUser = Pick<User, 'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, role = UserRole.TECHNICIAN) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findOneBy({ email })) {
      throw new ConflictException('El correo ya está registrado');
    }

    const user = this.users.create({
      email,
      passwordHash: await hash(dto.password, this.getSaltRounds()),
      role,
    });
    const savedUser = await this.users.save(user);
    return { user: this.toSafeUser(savedUser), ...(await this.createToken(savedUser)) };
  }

  async createUser(dto: RegisterDto, role: UserRole): Promise<SafeUser> {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findOneBy({ email })) {
      throw new ConflictException('El correo ya está registrado');
    }

    const user = this.users.create({
      email,
      passwordHash: await hash(dto.password, this.getSaltRounds()),
      role,
    });
    return this.toSafeUser(await this.users.save(user));
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    return { user: this.toSafeUser(user), ...(await this.createToken(user)) };
  }

  async getProfile(authenticatedUser: AuthenticatedUser): Promise<SafeUser> {
    const user = await this.users.findOneBy({ id: authenticatedUser.userId });
    if (!user) throw new UnauthorizedException('La cuenta ya no está disponible');
    return this.toSafeUser(user);
  }

  private async createToken(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '1d');
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: expiresIn as never,
    });
    return { accessToken, tokenType: 'Bearer' as const };
  }

  private getSaltRounds(): number {
    const rounds = Number(this.config.get<string>('BCRYPT_SALT_ROUNDS', '10'));
    return Number.isInteger(rounds) && rounds >= 4 && rounds <= 31 ? rounds : 10;
  }

  private toSafeUser(user: User): SafeUser {
    const { id, email, role, createdAt, updatedAt } = user;
    return { id, email, role, createdAt, updatedAt };
  }
}