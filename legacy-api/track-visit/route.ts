
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Interface for geolocation response
interface GeoLocation {
    country: string | null;
    countryCode: string | null;
    city: string | null;
    lat: number | null;
    lon: number | null;
}

// Fetch geolocation data from ip-api.com (free, no API key required)
async function getGeoLocation(ip: string): Promise<GeoLocation> {
    try {
        // Skip for localhost/private IPs
        if (ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
            return { country: null, countryCode: null, city: null, lat: null, lon: null };
        }

        // Get the first IP if multiple (x-forwarded-for can have multiple)
        const cleanIp = ip.split(',')[0].trim();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,city,lat,lon`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return { country: null, countryCode: null, city: null, lat: null, lon: null };
        }

        const data = await response.json();

        if (data.status === 'success') {
            return {
                country: data.country || null,
                countryCode: data.countryCode || null,
                city: data.city || null,
                lat: data.lat || null,
                lon: data.lon || null
            };
        }

        return { country: null, countryCode: null, city: null, lat: null, lon: null };
    } catch (error) {
        // Silent fail - geolocation is not critical
        console.error('[track-visit] Geolocation error:', error);
        return { country: null, countryCode: null, city: null, lat: null, lon: null };
    }
}

// Helper to increment visits and track unique with location
export async function POST(request: NextRequest) {
    try {
        // 1. Increment Total Page Views (simple counter)
        const { data } = await supabase.from('app_settings').select('value').eq('key', 'total_visits').single();
        let currentVisits = 0;
        if (data && data.value) {
            currentVisits = parseInt(data.value);
        }
        await supabase.from('app_settings').upsert({
            key: 'total_visits',
            value: currentVisits + 1,
            updated_at: new Date().toISOString()
        });

        // 2. Get IP and user agent
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Hash IP for privacy
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        // 3. Fetch geolocation data
        const geoLocation = await getGeoLocation(ip);

        // 4. Insert visitor log with location data
        // Using upsert with unique constraint on (ip_hash, visit_date)
        await supabase.from('visitor_logs').upsert({
            ip_hash: ipHash,
            user_agent: userAgent,
            visit_date: new Date().toISOString().split('T')[0],
            country: geoLocation.country,
            country_code: geoLocation.countryCode,
            city: geoLocation.city,
            latitude: geoLocation.lat,
            longitude: geoLocation.lon
        }, {
            onConflict: 'ip_hash,visit_date',
            ignoreDuplicates: true
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[track-visit] Error:", error);
        // Silent fail to not block client
        return NextResponse.json({ success: true });
    }
}
