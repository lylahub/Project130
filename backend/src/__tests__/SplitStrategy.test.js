import { EqualSplitStrategy, CustomSplitStrategy } from '../SplitStrategy';

describe('EqualSplitStrategy', () => {
  it('should split the amount equally among participants', () => {
    const strategy = new EqualSplitStrategy();
    const participants = ['user1', 'user2', 'user3'];
    const amount = 150;

    const result = strategy.calculateShare(amount, participants);

    expect(result).toEqual({
      user1: 50,
      user2: 50,
      user3: 50,
    });
  });

  it('should handle no participants', () => {
    const strategy = new EqualSplitStrategy();
    const participants = [];
    const amount = 150;

    expect(() => strategy.calculateShare(amount, participants)).toThrow();
  });
});

describe('CustomSplitStrategy', () => {
  it('split the amount based on custom percentages', () => {
    const strategy = new CustomSplitStrategy();
    const participants = ['user1', 'user2', 'user3'];
    const amount = 200;
    const split = {
      user1: 50,
      user2: 30,
      user3: 20,
    };

    const result = strategy.calculateShare(amount, participants, split);

    expect(result).toEqual({
      user1: 100,
      user2: 60,
      user3: 40,
    });
  });

  it('assign 0 to participants not in split object', () => {
    const strategy = new CustomSplitStrategy();
    const participants = ['user1', 'user2', 'user3'];
    const amount = 200;
    const split = {
      user1: 50, // 50%
    };

    const result = strategy.calculateShare(amount, participants, split);

    expect(result).toEqual({
      user1: 100,
      user2: 0,
      user3: 0,
    });
  });

  it('handle invalid percentages (input > 100 percent)', () => {
    const strategy = new CustomSplitStrategy();
    const participants = ['user1', 'user2'];
    const amount = 100;
    const split = {
      user1: 70,
      user2: 40, // Total is 110%
    };

    const result = strategy.calculateShare(amount, participants, split);
    expect(result).toEqual({
      user1: 70,
      user2: 40,
    });
  });
});
