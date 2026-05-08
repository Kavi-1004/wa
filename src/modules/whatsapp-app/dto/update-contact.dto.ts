import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, Matches } from "class-validator";

export class UpdateContactDto {
  @ApiPropertyOptional({
    description: "Phone number in international format (e.g. 919876543210)",
    example: "919876543210",
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{10,15}$/, {
    message:
      "phoneNumber must be 10-15 digits in international format without + prefix",
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: "Contact name for reference",
    example: "John Doe",
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: "Whether the contact is active",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
