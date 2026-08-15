import React, { useState } from 'react';
import { savePoster } from '../db/queries';
import { exportPosterCanvas } from '../utils/mapExport';

interface SavePosterProps {
  mapState: {
    title: string;
    subtitle: string;
    fontFamily: string;
    lat: number;
    lng: number;
    zoom: number;
    themeId: string;
    layoutId: string;
    markers: Array<{ lat: number; lng: number; label?: string }>;
  };
  userId: string;
}

export const SavePosterButton: React.FC<SavePosterProps> = ({ mapState, userId }) => {
  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

  const handleSaveAndExport = async () => {
    try {
      setLoading(true);

      await exportPosterCanvas({
        width: 1200,
        height: 1600,
        filename: `${mapState.title.toLowerCase().replace(/\s+/g, '-')}-poster`,
        format: 'png',
        title: mapState.title,
        subtitle: mapState.subtitle,
        lat: mapState.lat,
        lng: mapState.lng,
        fontFamily: mapState.fontFamily,
        themeId: mapState.themeId,
        markers: mapState.markers,
      });

      // Save record to database
      const newPoster = await savePoster({
        userId,
        title: mapState.title,
        subtitle: mapState.subtitle,
        fontFamily: mapState.fontFamily,
        lat: mapState.lat,
        lng: mapState.lng,
        zoom: mapState.zoom,
        // The DB stores the theme identifier in the existing theme_url column.
        themeUrl: mapState.themeId,
        layoutId: mapState.layoutId,
        markers: mapState.markers,
        imageUrl: null,
      });

      setSavedId(newPoster.id);
      alert(`Poster saved successfully! ID: ${newPoster.id}`);
    } catch (error) {
      console.error('Failed to export poster:', error);
      alert('Error saving poster. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSaveAndExport}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {loading ? 'Processing Poster...' : 'Save & Download Poster'}
      </button>
      {savedId && <span className="text-xs text-green-600">Saved! ID: {savedId}</span>}
    </div>
  );
};