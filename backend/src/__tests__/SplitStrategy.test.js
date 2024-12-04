import { SplitStrategy, EqualSplitStrategy, CustomSplitStrategy } from '../SplitStrategy';

describe('SplitStrategy (Abstract)', () => {
  it('throw an error when calculateShare is called directly', () => {
    const strategy = new SplitStrategy();
    expect(() => strategy.calculateShare(100, ['user1', 'user2'], {})).toThrow("Abstract");
  });
});

//testcases for equalsplit
describe('EqualSplitStrategy', () => {
  it('split the amount equally among participants', () => {
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

  it('throw an error for empty participants', () => {
    const strategy = new EqualSplitStrategy();
    expect(() => strategy.calculateShare(150, [])).toThrow("Participants array cannot be empty");
  });

  it('throw an error for no participants', () => {
    const strategy = new EqualSplitStrategy();
    expect(() => strategy.calculateShare(150, null)).toThrow("Participants array cannot be empty");
  });

  it('throw an error for undefined participants', () => {
    const strategy = new EqualSplitStrategy();
    expect(() => strategy.calculateShare(150, undefined)).toThrow("Participants array cannot be empty");
  });

  it('return 0 for all participants when total amount is 0', () => {
    const strategy = new EqualSplitStrategy();
    const participants = ['user1', 'user2', 'user3'];
    const result = strategy.calculateShare(0, participants);

    expect(result).toEqual({
      user1: 0,
      user2: 0,
      user3: 0,
    });
  });

  it('floating-point division', () => {
    const strategy = new EqualSplitStrategy();
    const participants = ['user1', 'user2'];
    const amount = 100.01;

    const result = strategy.calculateShare(amount, participants);

    expect(result).toEqual({
      user1: 50.005,
      user2: 50.005,
    });
  });
});


//test cases for customsplit strategy
describe('CustomSplitStrategy', () => {
  it('split amount based on custom percentages', () => {
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

  it('invalid percentages (input > 100 percent)', () => {
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

  it('empty split object', () => {
    const strategy = new CustomSplitStrategy();
    const participants = ['user1', 'user2'];
    const amount = 100;

    const result = strategy.calculateShare(amount, participants, {});

    expect(result).toEqual({
      user1: 0,
      user2: 0,
    });
  });

  it('throw error for empty participants', () => {
    const strategy = new CustomSplitStrategy();
    expect(() => strategy.calculateShare(200, [], {})).toThrow("Participants array cannot be empty");
  });

  it('return 0 for all participants when amount is 0', () => {
    const strategy = new CustomSplitStrategy();
    const participants = ['user1', 'user2', 'user3'];
    const split = {
      user1: 50,
      user2: 30,
      user3: 20,
    };

    const result = strategy.calculateShare(0, participants, split);

    expect(result).toEqual({
      user1: 0,
      user2: 0,
      user3: 0,
    });
  });

  it('floating-point multiplication', () => {
    const strategy = new CustomSplitStrategy();
    const participants = ['user1', 'user2'];
    const amount = 100.01;
    const split = {
      user1: 50,
      user2: 50,
    };

    const result = strategy.calculateShare(amount, participants, split);

    expect(result).toEqual({
      user1: 50.01,
      user2: 50.01,
    });
  });
});