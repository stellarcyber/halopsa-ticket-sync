import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString
} from 'class-validator';

export class HaloPsaTicketCreateDto {
  @IsString()
  summary: string; // subject

  @IsString()
  details: string; // case body
  
  @IsString()
  users_name: string;
  
  @IsNumber()
  tickettype_id: number;
  
  @IsNumber()
  client_id: number;
  
  @IsNumber()
  priority_id: number;
  
  @IsNumber()
  category_1: string;
  
  @IsNumber()
  impact: number;
  
  @IsNumber()
  urgency: number;
}

export class HaloPsaTicketPriorityObjDto {
  @IsString()
  name: string;
}

export class HaloTicketDto extends HaloPsaTicketCreateDto {
  @IsNumber()
  id: number;

  @IsBoolean()
  @IsOptional()
  hasbeenclosed?: boolean;

  @IsString()
  @IsOptional()
  closure_note?: string;

  @IsDateString()
  last_update: string;

  @IsString()
  agent_name: string;

  @IsObject()
  @Type(() => HaloPsaTicketPriorityObjDto)
  priority: HaloPsaTicketPriorityObjDto;
}
