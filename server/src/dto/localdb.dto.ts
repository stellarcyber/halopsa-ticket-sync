import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString
} from 'class-validator';

export class TicketDTO {
  @IsString()
  stellar_case_id: string;

  @IsNumber()
  stellar_case_number: number;

  @IsNumber()
  remote_ticket_id: number;
  
  @IsString()
  stellar_tenant_id: string;
  
  @IsNumber()
  stellar_last_modified: number;
  
  @IsNumber()
  remote_ticket_last_modified: number;
  
  @IsString()
  state: string;
}

export class TicketFullDTO extends TicketDTO {
  @IsString()
  instance_key: string;
}

export class TicketLinkageDTO {
  @IsString()
  stellar_case_id: string;

  @IsNumber()
  stellar_case_number: number;

  @IsString()
  remote_ticket_id: number;
}

export class CheckpointDTO {
  @IsNumber()
  @IsOptional()
  checkpoint?: number;
}

export class LocalCommentDTO {
  @IsString()
  instance_key: string;
  
  @IsString()
  stellar_case_id: string;
  
  @IsString()
  @IsOptional()
  halopsa_ticket_id?: number;
  
  @IsString()
  stellar_comment_id: string;
  
  @IsString()
  @IsOptional()
  halopsa_action_id?: number;

  @IsBoolean()
  system_comment: boolean;
}
