import {
  Controller,
  Post,
  Request,
  UseGuards,
  Body,
  Get,
  ParseIntPipe,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dtos/create-playlist.dto';
import { UpdatePlaylistDto } from './dtos/update-playlist.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlaylistResponseDto } from './dtos/playlist-response.dto';

@ApiTags('Playlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a playlist' })
  @ApiResponse({
    status: 201,
    description: 'Playlist created',
    type: PlaylistResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Request() req, @Body() dto: CreatePlaylistDto) {
    return this.playlistsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List playlists: all of them for admins, your own for other users',
  })
  @ApiResponse({
    status: 200,
    description: 'List of playlists',
    type: [PlaylistResponseDto],
  })
  findAll(@Request() req) {
    return this.playlistsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a playlist by ID' })
  @ApiResponse({
    status: 200,
    description: 'Playlist found',
    type: PlaylistResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access to this playlist is denied',
  })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.playlistsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a playlist by ID' })
  @ApiResponse({
    status: 200,
    description: 'Playlist updated',
    type: PlaylistResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'You cannot edit this playlist',
  })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a playlist by ID' })
  @ApiResponse({
    status: 200,
    description: 'Playlist deleted',
    type: PlaylistResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'You cannot delete this playlist',
  })
  @ApiResponse({ status: 404, description: 'Playlist not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.playlistsService.remove(id, req.user);
  }
}
