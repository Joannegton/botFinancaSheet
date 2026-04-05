import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { IOtpRepository } from '@domain/repositories/IOtpRepository';
import { OtpEntity } from '../entities/OtpEntity';

@Injectable()
export class OtpRepository implements IOtpRepository {
  constructor(
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,
  ) {}

  async salvar(phoneNumber: string, codigo: string, expiradoEm: Date): Promise<void> {
    const otp = this.otpRepository.create({
      phoneNumber,
      codigo,
      expiradoEm,
      codigoUtilizado: false,
    });
    await this.otpRepository.save(otp);
  }

  async obter(phoneNumber: string): Promise<OtpEntity | null> {
    const otp = await this.otpRepository.findOne({
      where: {
        phoneNumber,
        codigoUtilizado: false,
        expiradoEm: MoreThan(new Date()),
      },
      order: { criadoEm: 'DESC' },
    });
    return otp || null;
  }

  async marcarUtilizado(otpId: string): Promise<void> {
    await this.otpRepository.update({ id: otpId }, { codigoUtilizado: true });
  }

  async limparExpirados(): Promise<void> {
    await this.otpRepository.delete({
      expiradoEm: LessThan(new Date()),
    });
  }
}
