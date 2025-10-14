import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

export const StellarCaseSeverity = {
  Critical: 'Critical',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low'
} as const;
export type StellarCaseSeverity = keyof typeof StellarCaseSeverity;

export const StellarCaseStatus = {
  Escalated: 'Escalated',
  New: 'New',
  InProgress: 'In Progress',
  Resolved: 'Resolved',
  Canceled: 'Cancelled'
} as const;
export type StellarCaseStatus = (typeof StellarCaseStatus)[keyof typeof StellarCaseStatus];
export const stellarCaseStatusValuesSet = new Set<string>(Object.values(StellarCaseStatus));

export function isStellarCaseStatus(value: string): value is StellarCaseStatus {
  return stellarCaseStatusValuesSet.has(value);
}

export class StellarCaseCommentDTO {
  @IsString()
  comment: string;

  @IsString()
  _id: string;
  
  @IsString()
  case_id: string;
  
  @IsDateString()
  created_at: number;
  
  @IsDateString()
  @IsOptional()
  modified_at?: number;
  
  @IsString()
  user: string;
}

export class StellarCaseCommentResponseDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StellarCaseCommentDTO)
  data: StellarCaseCommentDTO[];
}

export class StellarCaseCommentCreateResponseDTO {
  @ValidateNested({ each: true })
  @Type(() => StellarCaseCommentDTO)
  data: StellarCaseCommentDTO;
}

export class StellarCaseDTO {
  @IsString()
  _id: string;
  
  @IsNumber()
  acknowledged: number;
  
  @IsString()
  assignee: string;
  
  @IsNumber()
  closed: number;

  @IsNumber()
  created_at: number;
  
  @IsString()
  created_by: string;
  
  @IsString()
  cust_id: string;
  modified_at: number;
  
  @IsString()
  modified_by: string;
  
  @IsString()
  name: string;
  
  @IsNumber()
  score: number;
  
  @IsNumber()
  size: number;
  
  @IsString()
  status: string;
  
  @IsString()
  severity: string;
  
  @IsString()
  tags: string[];
  
  @IsNumber()
  ticket_id: number;
  
  @IsNumber()
  version: number;
  
  @IsNumber()
  start_timestamp: number;
  
  @IsNumber()
  end_timestamp: number;
  
  @IsString()
  created_by_name: string;
  
  @IsString()
  modified_by_name: string;
  
  @IsString()
  assignee_name: string;
  
  @IsString()
  tenant_name: string;
  
  @IsString()
  tenant_group_name: string;
}

export class StellarCaseResponseDTO {
  @ValidateNested({ each: true })
  @Type(() => StellarCaseDTO)
  data: StellarCaseDTO;
}

export class StellarCasesInnerResponseDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StellarCaseDTO)
  cases: StellarCaseDTO[];

  @IsNumber()
  total: number;
}

export class StellarCasesResponseDTO {
  @ValidateNested({ each: true })
  @Type(() => StellarCasesInnerResponseDTO)
  data: StellarCasesInnerResponseDTO;
}
