import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useQuery } from '@apollo/client';
import RelationshipMapPage from '@/app/admin/relationship/page';
import { GET_HOME_LOCATION, GET_PINS } from '@/lib/graphql/queries/pin.queries';

jest.mock('@apollo/client', () => ({
  useQuery: jest.fn(),
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

jest.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="api-provider">{children}</div>,
  Map: ({ children }: { children: React.ReactNode }) => <div data-testid="google-map">{children}</div>,
  AdvancedMarker: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  InfoWindow: ({ children }: { children: React.ReactNode }) => <div data-testid="info-window">{children}</div>,
}));

const mockedUseQuery = useQuery as jest.Mock;

const pins = [
  {
    id: 'pin-1',
    date: '2026-03-15T00:00:00.000Z',
    placeName: 'Bistro Rex',
    amount: -145.13,
    lat: -33.8717,
    lng: 151.2252,
    category: 'Eat out',
    payment: 'Amex',
    city: 'Sydney',
    countryCode: 'AU',
    notes: null,
    source: 'test',
    createdAt: '2026-03-15T00:00:00.000Z',
  },
  {
    id: 'pin-2',
    date: '2026-02-21T00:00:00.000Z',
    placeName: 'Harbour View Hotel',
    amount: -35.6,
    lat: -33.857,
    lng: 151.207,
    category: 'Eat out',
    payment: 'Amex',
    city: 'Sydney',
    countryCode: 'AU',
    notes: null,
    source: 'test',
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
  });

  it('renders private summary and does not expose precise home address', () => {
    render(<RelationshipMapPage />);

    expect(screen.getByText('Our Sydney Adventures')).toBeInTheDocument();
    expect(screen.getByText('2 places')).toBeInTheDocument();
    expect(screen.getByText(/Precise home address intentionally not shown/i)).toBeInTheDocument();
    // Sentinel addresses - these strings should never render. If a regression
    // ever inlines a real address into the page, swap these for that pattern.
    expect(screen.queryByText(/123 Example Street/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Private Test Address/i)).not.toBeInTheDocument();
    expect(screen.getByText('Bistro Rex')).toBeInTheDocument();
    expect(screen.getByText('Harbour View Hotel')).toBeInTheDocument();
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
    mockedUseQuery.mockReturnValue({
      data: { pins: [] },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    render(<RelationshipMapPage />);

    expect(screen.getByText('No pins have been created yet.')).toBeInTheDocument();
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
});
