
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Interface for visitor location data
export interface VisitorLocation {
    country: string;
    countryCode: string;
    city: string | null;
    latitude: number;
    longitude: number;
    visitorCount: number;
}

// GET: Fetch aggregated visitor data by location
export async function GET(request: NextRequest) {
    try {
        // Check auth (optional - can be enabled for production)
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        // if (!session || session.value !== 'authenticated') {
        //     return NextResponse.json(
        //         { error: 'Unauthorized' },
        //         { status: 401 }
        //     );
        // }

        // Fetch all visitor logs with location data
        const { data: visitors, error } = await supabase
            .from('visitor_logs')
            .select('country, country_code, city, latitude, longitude')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

        if (error) {
            console.error('[Visitors API] Error fetching visitors:', error);
            return NextResponse.json(
                { error: 'Failed to fetch visitor data' },
                { status: 500 }
            );
        }

        // Aggregate visitors by country
        const countryMap = new Map<string, VisitorLocation>();

        visitors?.forEach((visitor) => {
            if (!visitor.country || !visitor.latitude || !visitor.longitude) return;

            const key = visitor.country_code || visitor.country;

            if (countryMap.has(key)) {
                const existing = countryMap.get(key)!;
                existing.visitorCount++;
            } else {
                countryMap.set(key, {
                    country: visitor.country,
                    countryCode: visitor.country_code || '',
                    city: null, // We aggregate by country, not city
                    latitude: visitor.latitude,
                    longitude: visitor.longitude,
                    visitorCount: 1
                });
            }
        });

        // Aggregate visitors by city for more granular data
        const cityMap = new Map<string, VisitorLocation>();

        visitors?.forEach((visitor) => {
            if (!visitor.city || !visitor.latitude || !visitor.longitude) return;

            const key = `${visitor.city}-${visitor.country_code}`;

            if (cityMap.has(key)) {
                const existing = cityMap.get(key)!;
                existing.visitorCount++;
            } else {
                cityMap.set(key, {
                    country: visitor.country || '',
                    countryCode: visitor.country_code || '',
                    city: visitor.city,
                    latitude: visitor.latitude,
                    longitude: visitor.longitude,
                    visitorCount: 1
                });
            }
        });

        // Get top countries and cities
        const countries = Array.from(countryMap.values())
            .sort((a, b) => b.visitorCount - a.visitorCount);

        const cities = Array.from(cityMap.values())
            .sort((a, b) => b.visitorCount - a.visitorCount)
            .slice(0, 50); // Limit to top 50 cities

        // Calculate marker data for globe (lat/long with size based on visitors)
        const markers = cities.map(location => ({
            location: [location.latitude, location.longitude] as [number, number],
            size: Math.min(0.1 + (location.visitorCount * 0.02), 0.5), // Size scales with visitors
            city: location.city,
            country: location.country,
            countryCode: location.countryCode,
            count: location.visitorCount
        }));

        // Total unique locations
        const totalLocations = countries.length;
        const totalVisitorsWithLocation = visitors?.length || 0;

        return NextResponse.json({
            success: true,
            data: {
                countries,
                cities,
                markers,
                stats: {
                    totalCountries: totalLocations,
                    totalCities: cities.length,
                    visitorsWithLocation: totalVisitorsWithLocation
                }
            }
        });

    } catch (error) {
        console.error('[Visitors API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
