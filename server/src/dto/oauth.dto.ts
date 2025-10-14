import {
  IsInt,
  IsNotEmpty,
  IsString
} from 'class-validator';

export class OauthResponseDTO {
  @IsString()
  @IsNotEmpty()
  scope: string;
  
  @IsString()
  @IsNotEmpty()
  token_type: string;
  
  @IsString()
  @IsNotEmpty()
  access_token: string;
  
  @IsInt()
  @IsNotEmpty()
  expires_in: number;
  
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
  
  @IsString()
  @IsNotEmpty()
  id_token: string;
}
