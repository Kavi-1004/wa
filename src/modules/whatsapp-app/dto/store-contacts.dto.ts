import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class WhatsAppContactDto {
  @ApiProperty({
    description: "Phone number in international format (e.g. 919876543210)",
    example: "919876543210",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,15}$/, {
    message:
      "phoneNumber must be 10-15 digits in international format without + prefix",
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: "Contact name for reference",
    example: "John Doe",
  })
  @IsString()
  @IsOptional()
  name?: string;
}

export class StoreContactsDto {
  @ApiProperty({
    description: "Array of WhatsApp contacts to store",
    type: [WhatsAppContactDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppContactDto)
  contacts: WhatsAppContactDto[];
}
