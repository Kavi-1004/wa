import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class SendBulkMessageDto {
  @ApiProperty({
    description: "Text message to send",
    example: "Hello from our service!",
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description:
      'Template name to use instead of a text message. When provided, "message" is stored for logging only.',
    example: "hello_world",
  })
  @IsString()
  @IsOptional()
  templateName?: string;

  @ApiProperty({
    description: "Array of contact IDs to send the message to",
    example: ["uuid-1", "uuid-2"],
  })
  @IsArray()
  @IsUUID("4", { each: true })
  contactIds: string[];
}
