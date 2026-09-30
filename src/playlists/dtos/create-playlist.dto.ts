import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreatePlaylistDto {
  @ApiProperty({ description: 'Playlist name', example: 'Heavy Rock' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Playlist genre',
    example: 'Metalcore',
  })
  @IsString()
  @IsNotEmpty()
  genre: string;

  @ApiProperty({
    description: 'Song names',
    example: ['just-pretend', 'limits', 'like a villain'],
  })
  @IsArray()
  @IsString({ each: true })
  musics: string[];
}
