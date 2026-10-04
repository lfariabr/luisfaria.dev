import { trackClientEvent } from '@/utils/analytics';

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

describe('trackClientEvent', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Start each test with no gtag
    delete (window as GtagWindow).gtag;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('calls window.gtag when it is defined', () => {
    const gtag = jest.fn();
    (window as GtagWindow).gtag = gtag;

    trackClientEvent('stripe_fab_opened', { foo: 'bar' });

    expect(gtag).toHaveBeenCalledWith('event', 'stripe_fab_opened', { foo: 'bar' });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('falls back to console.log when gtag is not defined', () => {
    trackClientEvent('stripe_item_selected', { productKey: 'coffee' });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[client-event]',
      'stripe_item_selected',
      { productKey: 'coffee' }
    );
  });

  it('uses empty object as default payload when none is provided', () => {
    const gtag = jest.fn();
    (window as GtagWindow).gtag = gtag;

    trackClientEvent('stripe_checkout_started');

    expect(gtag).toHaveBeenCalledWith('event', 'stripe_checkout_started', {});
  });

  it('swallows errors thrown by gtag and does not propagate', () => {
    (window as GtagWindow).gtag = () => {
      throw new Error('gtag exploded');
    };

    expect(() => trackClientEvent('stripe_checkout_error')).not.toThrow();
  });
});
