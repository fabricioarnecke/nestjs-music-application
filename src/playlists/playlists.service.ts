import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePlaylistDto } from './dtos/create-playlist.dto';
import { UpdatePlaylistDto } from './dtos/update-playlist.dto';
import { Role } from '@prisma/client';
import { PlaylistsRepository } from './playlists.repository';

// Unexpected errors (e.g. a database failure) are not caught here: Nest's default exception
// filter logs them and returns a generic 500, without exposing internal details.
@Injectable()
export class PlaylistsService {
  constructor(private playlistsRepository: PlaylistsRepository) {}

  async create(userId: number, dto: CreatePlaylistDto) {
    return this.playlistsRepository.create(userId, dto);
  }

  async findAll(user: { id: number; role: Role }) {
    if (user.role === Role.ADMIN) {
      return this.playlistsRepository.findAll();
    }

    return this.playlistsRepository.findAllByUserId(user.id);
  }

  async findOne(id: number, user: { id: number; role: Role }) {
    const playlist = await this.playlistsRepository.findById(id);
    if (!playlist) throw new NotFoundException('Playlist not found');

    if (user.role !== Role.ADMIN && playlist.user_id !== user.id) {
      throw new ForbiddenException('Access to this playlist is denied');
    }

    return playlist;
  }

  async update(
    id: number,
    dto: UpdatePlaylistDto,
    user: { id: number; role: Role },
  ) {
    const playlist = await this.playlistsRepository.findById(id);
    if (!playlist) throw new NotFoundException('Playlist not found');

    if (user.role !== Role.ADMIN && playlist.user_id !== user.id) {
      throw new ForbiddenException('You cannot edit this playlist');
    }

    return this.playlistsRepository.update(id, dto);
  }

  async remove(id: number, user: { id: number; role: Role }) {
    const playlist = await this.playlistsRepository.findById(id);
    if (!playlist) throw new NotFoundException('Playlist not found');

    if (user.role !== Role.ADMIN && playlist.user_id !== user.id) {
      throw new ForbiddenException('You cannot delete this playlist');
    }

    return this.playlistsRepository.delete(id);
  }
}
