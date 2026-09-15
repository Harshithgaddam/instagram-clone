import { jest } from '@jest/globals';

import { FixturePostRepository } from './fixture.repository';

describe('FixturePostRepository', () => {
  const configService = {
    get: jest.fn().mockReturnValue(0),
  };

  let repository: FixturePostRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    repository =
      new FixturePostRepository(
        configService as any,
      );
  });

  it('returns cloned post objects', async () => {
    const first =
      await repository.findById(
        '11111111-1111-4111-8111-111111111111',
      );

    const second =
      await repository.findById(
        '11111111-1111-4111-8111-111111111111',
      );

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  it('supports a controlled read failure', async () => {
    repository.setReadFailureForTests(true);

    await expect(
      repository.findById(
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toThrow(
      'Controlled repository read failure',
    );
  });

  it('recovers after the controlled failure is disabled', async () => {
    repository.setReadFailureForTests(true);

    await expect(
      repository.findById(
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toThrow();

    repository.setReadFailureForTests(false);

    const post =
      await repository.findById(
        '11111111-1111-4111-8111-111111111111',
      );

    expect(post).not.toBeNull();
  });
});