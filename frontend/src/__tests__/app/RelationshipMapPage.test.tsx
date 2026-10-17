import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useMutation, useQuery } from '@apollo/client';
import { RelationshipMap } from '@/components/relationship/RelationshipMap';

const RelationshipMapPage = () => <RelationshipMap />;
import { GET_HOME_LOCATION, GET_PINS } from '@/lib/graphql/queries/pin.queries';
import { CREATE_PIN, DELETE_PIN, UPDATE_PIN } from '@/lib/graphql/mutations/pin.mutations';
import { useCanViewRelationshipPins, useIsAdmin } from '@/lib/auth/isAdmin';

jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

jest.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="api-provider">{children}</div>,
  Map: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: (event: { detail: { latLng: { lat: number; lng: number } } }) => void;
  }) => (
    <div data-testid="google-map">
      <button type="button" onClick={() => onClick?.({ detail: { latLng: { lat: -33.9, lng: 151.25 } } })}>
        tap map
      </button>
      {children}
    </div>
  ),
  AdvancedMarker: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  InfoWindow: ({ children, headerContent }: { children: React.ReactNode; headerContent?: React.ReactNode }) => (
    <div data-testid="info-window">
      {headerContent}
      {children}
    </div>
  ),
  useMapsLibrary: () => null,
}));

jest.mock('@/lib/auth/isAdmin', () => ({
  useIsAdmin: jest.fn(() => false),
  useCanViewRelationshipPins: jest.fn(() => true),
}));

const mockedUseQuery = useQuery as jest.Mock;
const mockedUseMutation = useMutation as jest.Mock;
const mutate = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const pins = [
  {
    id: 'pin-1',
    date: '2026-03-15T00:00:00.000Z',
    placeName: 'Corner Cafe',
    amount: 42.5,
    lat: -33.8717,
    lng: 151.2252,
    category: 'Eat out',
    payment: 'Amex',
    city: 'Sydney',
    countryCode: 'AU',
    notes: null,
    source: 'test',
    placeId: null,
    createdAt: '2026-03-15T00:00:00.000Z',
  },
  {
    id: 'pin-2',
    date: '2026-02-21T00:00:00.000Z',
    placeName: 'Harbour Bistro',
    amount: 18,
    lat: -33.857,
    lng: 151.207,
    category: 'Eat out',
    payment: 'Amex',
    city: 'Sydney',
    countryCode: 'AU',
    notes: null,
    source: 'test',
    placeId: null,
    createdAt: '2026-02-21T00:00:00.000Z',
  },
];

interface QueryResultOverrides {
  pins?: { data?: unknown; loading?: boolean; error?: unknown; refetch?: jest.Mock };
  home?: { data?: unknown; loading?: boolean; error?: unknown };
}

const mockQueryResults = ({ pins: pinsOverride, home: homeOverride }: QueryResultOverrides = {}) => {
  const pinsResult = {
    data: { pins },
    loading: false,
    error: undefined,
    refetch: jest.fn(),
    ...pinsOverride,
  };
  const homeResult = {
    data: { relationshipHomeLocation: null },
    loading: false,
    error: undefined,
    ...homeOverride,
  };

  mockedUseQuery.mockImplementation((query: unknown) => {
    if (query === GET_HOME_LOCATION) return homeResult;
    if (query === GET_PINS) return pinsResult;
    return pinsResult;
  });

  return { pinsResult, homeResult };
};

describe('RelationshipMapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryResults();
    (useIsAdmin as jest.Mock).mockReturnValue(false);
    (useCanViewRelationshipPins as jest.Mock).mockReturnValue(true);
    Object.values(mutate).forEach((fn) => fn.mockResolvedValue({ data: {} }));
    mockedUseMutation.mockImplementation((document: unknown) => {
      if (document === CREATE_PIN) return [mutate.create];
      if (document === UPDATE_PIN) return [mutate.update];
      if (document === DELETE_PIN) return [mutate.delete];
      return [jest.fn()];
    });
  });

  it('renders private summary and does not expose precise home address', () => {
    render(<RelationshipMapPage />);

    expect(screen.getByText('Our Places')).toBeInTheDocument();
    expect(screen.getByText('2 places · 2 visits')).toBeInTheDocument();
    // Sentinel addresses - these strings should never render. If a regression
    // ever inlines a real address into the page, swap these for that pattern.
    expect(screen.queryByText(/123 Example Street/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Private Test Address/i)).not.toBeInTheDocument();
    expect(screen.getByText('Corner Cafe')).toBeInTheDocument();
    expect(screen.getByText('Harbour Bistro')).toBeInTheDocument();
  });

  it('shows the stats as pills and a short hint for phones', () => {
    render(<RelationshipMapPage />);

    const stats = within(screen.getByTestId('place-stats'));
    for (const stat of ['2 places · 2 visits', '$60.50', '15 Mar 2026']) {
      expect(stats.getByText(stat)).toHaveClass('rounded-full');
    }
    expect(screen.getByText('Tap a pin for details')).toHaveClass('sm:hidden');
    expect(screen.getByText('Click a marker or list item to see details')).toHaveClass('hidden', 'sm:inline');
  });

  it('shows missing map key fallback without hiding the timeline', () => {
    render(<RelationshipMapPage />);

    expect(screen.getByText(/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY/)).toBeInTheDocument();
    expect(screen.getByText('Visit timeline')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: jest.fn(),
    });

    render(<RelationshipMapPage />);

    expect(screen.getAllByText('Loading...')).toHaveLength(3);
    expect(screen.getByText('Loading relationship pins...')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    mockQueryResults({ pins: { data: { pins: [] } } });

    render(<RelationshipMapPage />);

    expect(screen.getByText('0 places · 0 visits')).toBeInTheDocument();
    expect(screen.getByText(/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY/)).toBeInTheDocument();
    expect(screen.getByText('No visits to list yet.')).toBeInTheDocument();
  });

  it('shows GraphQL error state and retries', () => {
    const refetch = jest.fn();
    mockedUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('GraphQL failed'),
      refetch,
    });

    render(<RelationshipMapPage />);

    expect(screen.getByText('Failed to load pins')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  describe('home marker', () => {
    const homeLocation = { label: 'Home base', lat: 1.23, lng: 2.34 };
    const ORIGINAL_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const ORIGINAL_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key';
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID = 'test-map-id';
    });

    afterEach(() => {
      if (ORIGINAL_KEY === undefined) {
        delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      } else {
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = ORIGINAL_KEY;
      }
      if (ORIGINAL_MAP_ID === undefined) {
        delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      } else {
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID = ORIGINAL_MAP_ID;
      }
    });

    it('renders home marker and legend entry when home query returns data', () => {
      mockQueryResults({ home: { data: { relationshipHomeLocation: homeLocation } } });

      render(<RelationshipMapPage />);

      expect(screen.getByTestId('home-marker')).toBeInTheDocument();
      expect(screen.getByText('Home base')).toBeInTheDocument();
    });

    it('renders home marker when there are no visit pins', () => {
      mockQueryResults({
        pins: { data: { pins: [] } },
        home: { data: { relationshipHomeLocation: homeLocation } },
      });

      render(<RelationshipMapPage />);

      expect(screen.getByText('0 places · 0 visits')).toBeInTheDocument();
      expect(screen.getByTestId('home-marker')).toBeInTheDocument();
      expect(screen.getByText('No visits to list yet.')).toBeInTheDocument();
    });

    it('omits home marker when home query returns null', () => {
      mockQueryResults({ home: { data: { relationshipHomeLocation: null } } });

      render(<RelationshipMapPage />);

      expect(screen.queryByTestId('home-marker')).not.toBeInTheDocument();
      expect(screen.queryByText('Home base')).not.toBeInTheDocument();
    });

    it('omits home marker silently when home query errors', () => {
      mockQueryResults({
        home: { data: undefined, error: new Error('home failed') },
      });

      render(<RelationshipMapPage />);

      expect(screen.queryByTestId('home-marker')).not.toBeInTheDocument();
      // The pins error UI must NOT show - pins query was successful
      expect(screen.queryByText('Failed to load pins')).not.toBeInTheDocument();
    });

    it('opens info window with label only when home marker is clicked', () => {
      mockQueryResults({ home: { data: { relationshipHomeLocation: homeLocation } } });

      render(<RelationshipMapPage />);

      const marker = screen.getByTestId('home-marker');
      const button = marker.closest('button');
      expect(button).not.toBeNull();
      fireEvent.click(button as HTMLButtonElement);

      // Label appears in both the legend and the info window
      expect(screen.getAllByText('Home base').length).toBeGreaterThanOrEqual(2);

      // No street suffix or numeric coordinate should be rendered anywhere
      expect(screen.queryByText(/\b(St|Rd|Ave|Street|Road|Avenue)\b/)).not.toBeInTheDocument();
      expect(screen.queryByText(/1\.23/)).not.toBeInTheDocument();
      expect(screen.queryByText(/2\.34/)).not.toBeInTheDocument();
    });
  });
  it('renders a pin without a spend and leaves it out of the total', () => {
    mockQueryResults({
      pins: {
        data: {
          pins: [
            ...pins,
            { ...pins[1], id: 'pin-3', placeName: 'Park Kiosk', amount: null, category: 'Visit', payment: null },
          ],
        },
      },
    });

    render(<RelationshipMapPage />);

    expect(screen.getByText('Park Kiosk')).toBeInTheDocument();
    expect(screen.getByText('$60.50')).toBeInTheDocument();
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
  });

  it('hides add and edit actions from viewers who cannot write', () => {
    (useCanViewRelationshipPins as jest.Mock).mockReturnValue(false);

    render(<RelationshipMapPage />);

    expect(screen.queryByRole('button', { name: /add place/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit corner cafe/i })).not.toBeInTheDocument();
  });

  describe('adding and editing', () => {
    const ORIGINAL_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const ORIGINAL_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key';
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID = 'test-map-id';
    });

    afterEach(() => {
      if (ORIGINAL_KEY === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      else process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = ORIGINAL_KEY;
      if (ORIGINAL_MAP_ID === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      else process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID = ORIGINAL_MAP_ID;
    });

    it('stacks repeat visits on one marker and lists each with its own edit', () => {
      mockQueryResults({
        pins: {
          data: {
            pins: [
              { ...pins[0], id: 'pin-new', date: '2026-06-21T00:00:00.000Z', placeId: 'place-corner', amount: 76.89 },
              { ...pins[0], id: 'pin-old', placeName: 'Corner Cafe Potts Point', placeId: 'place-corner', amount: 72.96 },
              pins[1],
            ],
          },
        },
      });

      render(<RelationshipMapPage />);

      expect(screen.getByText('2 places · 3 visits')).toBeInTheDocument();
      expect(screen.getByTestId('visit-count')).toHaveTextContent('2');
      fireEvent.click(screen.getByTestId('visit-count').closest('button') as HTMLButtonElement);

      const popup = screen.getByTestId('info-window');
      expect(popup).toHaveTextContent('2 visits · $149.85');
      expect(popup).toHaveTextContent('as Corner Cafe Potts Point');
      fireEvent.click(screen.getByRole('button', { name: /edit corner cafe potts point on/i }));
      expect(screen.getByLabelText('Name')).toHaveValue('Corner Cafe Potts Point');
    });

    it('keeps the popup to name, location, date and amount', () => {
      mockQueryResults({ pins: { data: { pins: [{ ...pins[1], notes: 'window seat' }] } } });
      render(<RelationshipMapPage />);

      fireEvent.click(screen.getByText('Harbour Bistro'));

      const popup = screen.getByTestId('info-window');
      expect(within(popup).getByRole('heading', { name: 'Harbour Bistro' })).toBeInTheDocument();
      expect(popup).toHaveTextContent('Sydney, AU');
      expect(popup).toHaveTextContent('21 Feb 2026');
      expect(popup).toHaveTextContent('$18.00');
      expect(popup).not.toHaveTextContent(/eat out|amex|window seat/i);
    });

    it('opens the stack from a timeline row', () => {
      render(<RelationshipMapPage />);

      fireEvent.click(screen.getByText('Harbour Bistro'));

      expect(screen.getByTestId('info-window')).toHaveTextContent('Harbour Bistro');
    });

    it('adds a place picked on the map, with no spend', async () => {
      render(<RelationshipMapPage />);

      fireEvent.click(screen.getByRole('button', { name: /add place/i }));
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Park Kiosk' } });
      fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'sunset walk' } });
      fireEvent.click(screen.getByRole('button', { name: /pick on map/i }));

      expect(screen.getByText(/tap the map where the place is/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'tap map' }));
      expect(screen.getByTestId('draft-marker')).toBeInTheDocument();

      // The form comes back with what was typed before picking.
      expect(screen.getByLabelText('Name')).toHaveValue('Park Kiosk');
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^add place$/i, hidden: false }));
      });

      expect(mutate.create).toHaveBeenCalledWith({
        variables: {
          input: expect.objectContaining({
            placeName: 'Park Kiosk',
            notes: 'sunset walk',
            lat: -33.9,
            lng: 151.25,
            source: 'app',
          }),
        },
      });
      expect(mutate.create.mock.calls[0][0].variables.input).not.toHaveProperty('amount');
    });

    it('does not look like a card form to Safari or password managers', () => {
      render(<RelationshipMapPage />);
      fireEvent.click(screen.getByRole('button', { name: /add place/i }));

      const form = screen.getByLabelText('Name').closest('form') as HTMLFormElement;
      expect(form).toHaveAttribute('autocomplete', 'off');
      for (const field of form.querySelectorAll('input, textarea')) {
        expect(field).toHaveAttribute('autocomplete', 'off');
        expect(field).toHaveAttribute('data-1p-ignore');
        expect(field).toHaveAttribute('data-lpignore', 'true');
      }
      // "payment" in a field's name or id is what makes Safari offer saved cards.
      for (const field of form.querySelectorAll('[id], [name], [list]')) {
        expect(`${field.id} ${field.getAttribute('name')} ${field.getAttribute('list')}`).not.toMatch(/payment/i);
      }
      expect(screen.getByLabelText('Payment')).toHaveAttribute('name', 'paidWith');
    });

    it('gives Spent a dollar prefix, the decimal keypad and a next key', () => {
      render(<RelationshipMapPage />);
      fireEvent.click(screen.getByRole('button', { name: /add place/i }));

      const spent = screen.getByLabelText(/spent/i);
      expect(spent).toHaveAttribute('inputmode', 'decimal');
      // type="number" empties itself when Safari's keypad types a decimal comma.
      expect(spent).toHaveAttribute('type', 'text');
      expect(spent).toHaveAttribute('enterkeyhint', 'next');
      expect(spent.parentElement).toHaveTextContent('$');
      expect(screen.getByLabelText('Payment')).toHaveAttribute('enterkeyhint', 'done');
    });

    it('keeps the header and Add place outside the part that scrolls', () => {
      render(<RelationshipMapPage />);
      fireEvent.click(screen.getByRole('button', { name: /add place/i }));

      const body = screen.getByTestId('pin-form-body');
      expect(body).toContainElement(screen.getByLabelText('Name'));
      expect(body).not.toContainElement(screen.getByRole('heading', { name: 'Add a place' }));
      expect(body).not.toContainElement(screen.getByRole('button', { name: /^add place$/i }));
    });

    it('fits the sheet to the area above the iOS keyboard', () => {
      class FakeVisualViewport extends EventTarget {
        height = 500;
        offsetTop = 40;
      }
      Object.defineProperty(window, 'visualViewport', { value: new FakeVisualViewport(), configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
      render(<RelationshipMapPage />);
      fireEvent.click(screen.getByRole('button', { name: /add place/i }));

      const sheet = screen.getByRole('dialog');
      expect(sheet.style.getPropertyValue('--kb-top')).toBe('40px');
      expect(sheet.style.getPropertyValue('--kb')).toBe('260px');
      Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true });
    });

    it('scrolls a focused field to the middle once the keyboard is up', () => {
      jest.useFakeTimers();
      const scrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      render(<RelationshipMapPage />);
      fireEvent.click(screen.getByRole('button', { name: /add place/i }));

      fireEvent.focus(screen.getByLabelText('Notes'));
      expect(scrollIntoView).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
      expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByLabelText('Notes'));
      jest.useRealTimers();
    });

    it('does not submit without a location', async () => {
      render(<RelationshipMapPage />);

      fireEvent.click(screen.getByRole('button', { name: /add place/i }));
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Park Kiosk' } });
      await act(async () => {
        fireEvent.submit(screen.getByLabelText('Name').closest('form') as HTMLFormElement);
      });

      expect(screen.getByText(/search for the place or pick it on the map/i)).toBeInTheDocument();
      expect(mutate.create).not.toHaveBeenCalled();
    });

    it('edits only the changed fields', async () => {
      render(<RelationshipMapPage />);

      fireEvent.click(screen.getByRole('button', { name: /edit corner cafe/i }));
      expect(screen.getByLabelText('Name')).toHaveValue('Corner Cafe');
      fireEvent.change(screen.getByLabelText(/spent/i), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'anniversary' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
      });

      expect(mutate.update).toHaveBeenCalledWith({
        variables: { id: 'pin-1', input: { amount: null, notes: 'anniversary' } },
      });
    });

    it('offers delete to admin only, behind a confirm', async () => {
      render(<RelationshipMapPage />);
      fireEvent.click(screen.getByRole('button', { name: /edit corner cafe/i }));
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('lets admin delete after confirming', async () => {
      (useIsAdmin as jest.Mock).mockReturnValue(true);
      render(<RelationshipMapPage />);

      fireEvent.click(screen.getByRole('button', { name: /edit corner cafe/i }));
      fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
      expect(mutate.delete).not.toHaveBeenCalled();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /delete for good/i }));
      });

      expect(mutate.delete).toHaveBeenCalledWith({ variables: { id: 'pin-1' } });
      await waitFor(() => expect(screen.queryByLabelText('Name')).not.toBeInTheDocument());
    });
  });

  describe('visit timeline', () => {
    // Newest first, as the API returns them.
    const visits = (count: number) =>
      Array.from({ length: count }, (_, index) => ({
        ...pins[0],
        id: `visit-${index}`,
        placeName: `Visit ${index + 1}`,
        date: `2026-05-${String(28 - index).padStart(2, '0')}T00:00:00.000Z`,
        lat: pins[0].lat + index * 0.01,
      }));
    const rows = () => screen.queryAllByTestId('timeline-visit').map((row) => row.querySelector('p')?.textContent);

    it('shows the latest 3 and adds 5 more per tap', () => {
      mockQueryResults({ pins: { data: { pins: visits(15) } } });
      render(<RelationshipMapPage />);

      expect(rows()).toEqual(['Visit 1', 'Visit 2', 'Visit 3']);
      expect(screen.queryByRole('button', { name: 'Show less' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'See 5 more' }));
      expect(rows()).toHaveLength(8);
      expect(rows()[7]).toBe('Visit 8');
      fireEvent.click(screen.getByRole('button', { name: 'See 5 more' }));
      expect(rows()).toHaveLength(13);
      fireEvent.click(screen.getByRole('button', { name: 'See 2 more' }));
      expect(rows()).toHaveLength(15);
      expect(screen.queryByRole('button', { name: /^see \d+ more$/i })).not.toBeInTheDocument();
    });

    it('collapses back to 3 with Show less', () => {
      mockQueryResults({ pins: { data: { pins: visits(15) } } });
      render(<RelationshipMapPage />);

      fireEvent.click(screen.getByRole('button', { name: 'See 5 more' }));
      fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
      expect(rows()).toEqual(['Visit 1', 'Visit 2', 'Visit 3']);
    });

    it('has no toggle with 3 visits or fewer', () => {
      mockQueryResults({ pins: { data: { pins: visits(3) } } });
      render(<RelationshipMapPage />);

      expect(rows()).toHaveLength(3);
      expect(screen.queryByRole('button', { name: /see more|show less/i })).not.toBeInTheDocument();
    });

    it('has no toggle with no visits', () => {
      mockQueryResults({ pins: { data: { pins: [] } } });
      render(<RelationshipMapPage />);

      expect(rows()).toHaveLength(0);
      expect(screen.queryByRole('button', { name: /see more/i })).not.toBeInTheDocument();
    });
  });

  describe('hiding amounts', () => {
    beforeEach(() => window.localStorage.clear());

    it('hides and shows every amount on the page', () => {
      render(<RelationshipMapPage />);
      expect(screen.getByText('$60.50')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
      expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
      expect(screen.getAllByText('$••••').length).toBeGreaterThanOrEqual(3); // total + two timeline rows

      fireEvent.click(screen.getByRole('button', { name: 'Show amounts' }));
      expect(screen.getByText('$60.50')).toBeInTheDocument();
    });

    it('hides amounts in the pin popup too', () => {
      const env = process.env;
      process.env = { ...env, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-maps-key', NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: 'test-map-id' };
      try {
        render(<RelationshipMapPage />);
        fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
        fireEvent.click(screen.getByText('Harbour Bistro'));

        expect(screen.getByTestId('info-window')).toHaveTextContent('$••••');
        expect(screen.getByTestId('info-window')).not.toHaveTextContent('$18.00');
      } finally {
        process.env = env;
      }
    });

    it('remembers the choice across a reload', () => {
      const { unmount } = render(<RelationshipMapPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
      unmount();

      render(<RelationshipMapPage />);
      expect(screen.getByRole('button', { name: 'Show amounts' })).toBeInTheDocument();
      expect(screen.queryByText('$60.50')).not.toBeInTheDocument();
    });

    it('still toggles when storage is blocked', () => {
      const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      try {
        render(<RelationshipMapPage />);
        fireEvent.click(screen.getByRole('button', { name: 'Hide amounts' }));
        expect(screen.queryByText('$60.50')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Show amounts' }));
        expect(screen.getByText('$60.50')).toBeInTheDocument();
      } finally {
        getItem.mockRestore();
        setItem.mockRestore();
      }
    });
  });
});
