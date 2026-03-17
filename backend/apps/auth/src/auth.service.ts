import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '@app/database';
import { RegisterDto, LoginDto, UpdatePreferencesDto } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { name, email, password } = dto ?? {} as any;

    if (!email || !password || !name) {
      throw new RpcException('Name, email and password are required');
    }

    const existing = await this.userRepo.findOne({
      where: { email },
    });

    if (existing) {
      throw new RpcException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      name,
      email,
      passwordHash,
    });

    await this.userRepo.save(user);

    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto ?? {} as any;

    if (!email || !password) {
      throw new RpcException('Email and password are required');
    }

    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new RpcException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new RpcException('Invalid email or password');
    }

    // Update last active
    await this.userRepo.update(user.id, {
      lastActiveAt: new Date(),
      isOnline: true,
    });

    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async validateToken(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new RpcException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findAll(query: { limit: number; offset: number; search?: string }) {
    const where: any = {};
    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    const [users, total] = await this.userRepo.findAndCount({
      where,
      take: query.limit,
      skip: query.offset,
      order: { createdAt: 'DESC' },
    });

    return {
      items: users.map((u) => this.sanitizeUser(u)),
      total,
    };
  }

  async getPreferences(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new RpcException('User not found');
    }
    return user.preferences ?? {};
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new RpcException('User not found');
    }

    const merged = { ...(user.preferences ?? {}), ...dto };
    await this.userRepo.update(userId, { preferences: merged });
    return merged;
  }

  async updateUser(id: string, dto: Partial<UserEntity>) {
    // Only allow updating specific fields
    const allowedFields: (keyof UserEntity)[] = ['name', 'role', 'isOnline'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (dto[field] !== undefined) {
        updateData[field] = dto[field];
      }
    }

    await this.userRepo.update(id, updateData);
    const user = await this.userRepo.findOne({ where: { id } });

    return this.sanitizeUser(user!);
  }

  private generateToken(user: UserEntity): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private sanitizeUser(user: UserEntity) {
    const { passwordHash, ...result } = user;
    return result;
  }
}
