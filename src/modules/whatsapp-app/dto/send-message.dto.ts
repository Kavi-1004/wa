import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendMessageDto {
  @ApiProperty({
    description: "Text message to send to all stored contacts",
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
}
