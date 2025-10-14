import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class HaloPsaActionCreateDTO {
  ticket_id: number;
  note?: string;
  note_html?: string;
  who: string;
  outcome: 'Internal Note' | 'Note';
  hiddenfromuser?: boolean;
}

export class HaloPsaActionUpdateDTO extends HaloPsaActionCreateDTO {
  id: number;
}

export class HaloPsaActionDTO {
  @IsNumber()
  @Min(1)
  ticket_id: number;

  @IsNumber()
  @Min(1)
  id: number;

  @IsString()
  outcome: string;

  @IsString()
  who: string;

  @IsNumber()
  @Min(0)
  who_type: number;

  @IsString()
  who_imgpath: string;

  @IsNumber()
  @Min(0)
  who_agentid: number;

  @IsDateString()
  datetime: string;

  @IsDateString()
  actiondatecreated: string;

  @IsString()
  note: string;
  
  @IsString()
  @IsOptional()
  note_html?: string;

  @IsNumber()
  @Min(0)
  replied_to_ticket_id: number;

  @IsNumber()
  @Min(0)
  replied_to_action_id: number;

  @IsNumber()
  @Min(0)
  created_from_ticket_id: number;

  @IsNumber()
  @Min(0)
  created_from_action_id: number;

  @IsNumber()
  action_contract_id: number;

  @IsNumber()
  action_travel_contract_id: number;

  @IsNumber()
  @Min(1)
  project_id: number;

  @IsBoolean()
  personal_unread: boolean;

  @IsDateString()
  actionarrivaldate: string;

  @IsDateString()
  actioncompletiondate: string;

  @IsArray()
  translations: any[];

  @IsString()
  on_behalf_of_name: string;

  @IsNumber()
  @Min(0)
  actionby_agent_id: number;

  @IsString()
  guid: string;

  @IsNumber()
  @Min(0)
  actioncontractid: number;

  @IsBoolean()
  actisbillable: boolean;

  @IsBoolean()
  actisreadyforprocessing: boolean;

  @IsBoolean()
  travelisreadyforprocessing: boolean;

  @IsNumber()
  @Min(0)
  outcome_id: number;

  @IsNumber()
  @Min(0)
  action_systemid: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timetaken?: number;

  @IsNumber()
  @Min(0)
  timetakendays: number;

  @IsNumber()
  @Min(0)
  timetakenadjusted: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nonbilltime?: number;

  @IsNumber()
  @Min(0)
  actionchargehours: number;

  @IsNumber()
  @Min(0)
  actionnonchargeamount: number;

  @IsNumber()
  @Min(0)
  actionnonchargehours: number;

  @IsNumber()
  @Min(0)
  actionchargeamount: number;

  @IsNumber()
  @Min(0)
  actionprepayhours: number;

  @IsNumber()
  @Min(0)
  actionprepayamount: number;

  @IsNumber()
  @Min(0)
  actiontravelchargehours: number;

  @IsNumber()
  @Min(0)
  chargerate: number;

  @IsNumber()
  @Min(0)
  travel_chargerate: number;

  @IsBoolean()
  hiddenfromuser: boolean;

  @IsBoolean()
  important: boolean;

  @IsNumber()
  @Min(0)
  old_status: number;

  @IsNumber()
  @Min(0)
  new_status: number;

  @IsString()
  new_status_name: string;

  @IsString()
  colour: string;

  @IsNumber()
  @Min(0)
  attachment_count: number;

  @IsNumber()
  @Min(0)
  unread: number;

  @IsString()
  actionby_application_id: string;

  @IsNumber()
  @Min(0)
  actionby_user_id: number;
}

// Root DTO for the entire JSON structure
export class HaloPsaTicketActionsDTO {
  @IsNumber()
  @Min(1)
  ticket_id: number;

  @IsNumber()
  @Min(0)
  record_count: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HaloPsaActionDTO)
  actions: HaloPsaActionDTO[];
}
