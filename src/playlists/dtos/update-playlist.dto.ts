import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePlaylistDto {
  @ApiPropertyOptional({
    description: 'New playlist name',
    example: 'Heavy Rock 2025',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'New playlist genre',
    example: 'Metal',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  genre?: string;

  @ApiPropertyOptional({
    description: 'New list of song names',
    example: ['snuff', 'psychosocial', 'dead memories'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  musics?: string[];
}
