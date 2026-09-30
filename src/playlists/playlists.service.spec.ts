import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PlaylistsRepository } from './playlists.repository';
import { PlaylistsService } from './playlists.service';

describe('PlaylistsService', () => {
  const owner = { id: 1, role: Role.USER };
  const otherUser = { id: 2, role: Role.USER };
  const admin = { id: 3, role: Role.ADMIN };
  const playlist = {
    id: 10,
    name: 'Heavy Rock',
    genre: 'Metal',
    musics: ['snuff'],
    user_id: owner.id,
  };

  let service: PlaylistsService;
  let repository: Record<
    'create' | 'findAll' | 'findAllByUserId' | 'findById' | 'update' | 'delete',
    jest.Mock
  >;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn().mockResolvedValue(playlist),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        { provide: PlaylistsRepository, useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(PlaylistsService);
  });

  it('create saves the playlist for the logged-in user', async () => {
    const dto = { name: 'Heavy Rock', genre: 'Metal', musics: ['snuff'] };

    await service.create(owner.id, dto);

    expect(repository.create).toHaveBeenCalledWith(owner.id, dto);
  });

  describe('findAll', () => {
    it('returns every playlist to an admin', async () => {
      await service.findAll(admin);

      expect(repository.findAll).toHaveBeenCalled();
      expect(repository.findAllByUserId).not.toHaveBeenCalled();
    });

    it('returns only their own playlists to a regular user', async () => {
      await service.findAll(owner);

      expect(repository.findAllByUserId).toHaveBeenCalledWith(owner.id);
      expect(repository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the playlist to its owner', async () => {
      await expect(service.findOne(10, owner)).resolves.toBe(playlist);
    });

    it('returns any playlist to an admin', async () => {
      await expect(service.findOne(10, admin)).resolves.toBe(playlist);
    });

    it("blocks a user from reading someone else's playlist", async () => {
      await expect(service.findOne(10, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when the playlist does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne(99, owner)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const changes = { name: 'Heavy Rock 2025' };

    it('lets the owner update the playlist', async () => {
      await service.update(10, changes, owner);

      expect(repository.update).toHaveBeenCalledWith(10, changes);
    });

    it('lets an admin update any playlist', async () => {
      await service.update(10, changes, admin);

      expect(repository.update).toHaveBeenCalledWith(10, changes);
    });

    it("blocks a user from updating someone else's playlist", async () => {
      await expect(service.update(10, changes, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the playlist does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update(99, changes, owner)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('lets the owner delete the playlist', async () => {
      await service.remove(10, owner);

      expect(repository.delete).toHaveBeenCalledWith(10);
    });

    it('lets an admin delete any playlist', async () => {
      await service.remove(10, admin);

      expect(repository.delete).toHaveBeenCalledWith(10);
    });

    it("blocks a user from deleting someone else's playlist", async () => {
      await expect(service.remove(10, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the playlist does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(99, owner)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
