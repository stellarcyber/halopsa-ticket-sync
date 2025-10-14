import { hostnameWithOptionalPort } from ':app/regex-common.js';
import {
  IsBoolean,
  IsString,
  Matches
} from 'class-validator';

export class StellarServerDTO {
  @Matches(hostnameWithOptionalPort)
  @IsString()
  host!: string;

  @IsString()
  user!: string;

  @IsString()
  apiKey!: string;

  @IsBoolean()
  verifySSL!: boolean;
}
