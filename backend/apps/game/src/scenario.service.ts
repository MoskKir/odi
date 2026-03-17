import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScenarioEntity } from '@app/database';
import { UserRole } from '@app/common';

@Injectable()
export class ScenarioService {
  constructor(
    @InjectRepository(ScenarioEntity)
    private readonly scenarioRepo: Repository<ScenarioEntity>,
  ) {}

  async findAll(role: string) {
    const where: any = {};

    // Non-admin users only see published scenarios
    if (role !== UserRole.ADMIN) {
      where.published = true;
    }

    return this.scenarioRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: Partial<ScenarioEntity>) {
    const scenario = this.scenarioRepo.create(dto);
    return this.scenarioRepo.save(scenario);
  }

  async update(id: string, dto: Partial<ScenarioEntity>) {
    await this.scenarioRepo.update(id, dto);
    return this.scenarioRepo.findOne({ where: { id } });
  }

  async delete(id: string) {
    await this.scenarioRepo.delete(id);
    return { deleted: true };
  }
}
